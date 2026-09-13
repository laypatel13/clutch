"""Tests for syncing GitHub events into activity_events.

Payloads here are small hand-written fixtures modelled on the shapes the real
Events API returns — including its trimming: push events carry only SHAs, and
PR/review events carry a number but no title.
"""

import asyncio
import json
import re
from datetime import timezone

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — registers every model on Base.metadata
from app.database import Base, get_db
from app.dependencies import get_current_user, get_github_client
from app.main import app as fastapi_app
from app.models.activity_event import ActivityEvent
from app.models.pull_request import PullRequest
from app.models.user import User
from app.services.activity_sync import (
    GitHubUnavailable,
    build_title_query,
    normalize_event,
    parse_github_time,
    sync_activity_events,
)

ZERO_SHA = "0" * 40


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_event(event_id, event_type, payload, *, repo="lay/clutch", created_at="2026-09-12T21:07:00Z", public=True):
    return {
        "id": str(event_id),
        "type": event_type,
        "repo": {"name": repo},
        "payload": payload,
        "public": public,
        "created_at": created_at,
    }


def push(event_id, before="b" * 40, head="h" * 40, ref="refs/heads/develop", **kwargs):
    return make_event(event_id, "PushEvent", {"before": before, "head": head, "ref": ref, "push_id": 1}, **kwargs)


def trimmed_pr_event(event_id, number, action, **kwargs):
    # The real API currently sends pull_request with no title.
    return make_event(event_id, "PullRequestEvent", {
        "action": action,
        "number": number,
        "pull_request": {"id": 99, "number": number, "url": "https://api.github.com/x"},
    }, **kwargs)


def review_event(event_id, number, **kwargs):
    return make_event(event_id, "PullRequestReviewEvent", {
        "action": "created",
        "review": {"state": "commented"},
        "pull_request": {"number": number},
    }, **kwargs)


def issue_comment_event(event_id, number, title, **kwargs):
    return make_event(event_id, "IssueCommentEvent", {
        "action": "created",
        "issue": {"number": number, "title": title, "html_url": f"https://github.com/lay/clutch/issues/{number}"},
        "comment": {"html_url": f"https://github.com/lay/clutch/issues/{number}#issuecomment-1"},
    }, **kwargs)


class FakeGitHub:
    """Stands in for api.github.com behind httpx.MockTransport, recording every call."""

    def __init__(self):
        self.event_pages: dict[int, list] = {1: []}
        self.events_status = 200
        self.compare: dict[str, tuple[int, dict]] = {}
        self.commit: dict[str, tuple[int, dict]] = {}
        self.titles: dict[tuple[str, int], str] = {}
        self.graphql_status = 200
        self.calls: list[str] = []

    def handler(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        self.calls.append(path)

        if path.endswith("/events"):
            if self.events_status != 200:
                return httpx.Response(self.events_status, json={"message": "nope"})
            page = int(request.url.params.get("page", 1))
            return httpx.Response(200, json=self.event_pages.get(page, []))

        if "/compare/" in path:
            status, body = self.compare.get(path.split("/compare/")[1], (404, {}))
            return httpx.Response(status, json=body)

        if "/commits/" in path:
            status, body = self.commit.get(path.rsplit("/", 1)[1], (404, {}))
            return httpx.Response(status, json=body)

        if path == "/graphql":
            if self.graphql_status != 200:
                return httpx.Response(self.graphql_status, json={})
            query = json.loads(request.read())["query"]
            data = {}
            pattern = r'r(\d+): repository\(owner: "([^"]+)", name: "([^"]+)"\) \{ issueOrPullRequest\(number: (\d+)\)'
            for alias, owner, name, number in re.findall(pattern, query):
                title = self.titles.get((f"{owner}/{name}", int(number)))
                data[f"r{alias}"] = {"issueOrPullRequest": {"title": title} if title else None}
            return httpx.Response(200, json={"data": data})

        return httpx.Response(404, json={})

    def client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(transport=httpx.MockTransport(self.handler))

    def count(self, fragment: str) -> int:
        return sum(fragment in call for call in self.calls)


def compare_body(*messages):
    return {"commits": [{"sha": f"s{i}", "commit": {"message": m}} for i, m in enumerate(messages)]}


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


@pytest.fixture
def user(db):
    account = User(github_id=1, username="lay", github_access_token="token")
    db.add(account)
    db.commit()
    return account


def run_sync(user, db, github):
    async def go():
        async with github.client() as client:
            return await sync_activity_events(user, db, client)
    return asyncio.run(go())


def rows(db):
    return {row.github_event_id: row for row in db.query(ActivityEvent).all()}


# ---------------------------------------------------------------------------
# normalize_event
# ---------------------------------------------------------------------------

def test_push_links_to_the_compare_view_and_strips_the_ref():
    row = normalize_event(push(1, before="a" * 40, head="c" * 40, ref="refs/heads/feat/timeline"))
    assert row["ref"] == "feat/timeline"
    assert row["url"] == f"https://github.com/lay/clutch/compare/{'a' * 40}...{'c' * 40}"


def test_push_to_a_new_branch_links_to_the_head_commit():
    row = normalize_event(push(1, before=ZERO_SHA, head="c" * 40))
    assert row["url"] == f"https://github.com/lay/clutch/commit/{'c' * 40}"


def test_trimmed_pull_request_event_has_no_title_and_builds_its_link():
    row = normalize_event(trimmed_pr_event(1, 83, "merged"))
    assert (row["action"], row["subject_number"], row["title"]) == ("merged", 83, None)
    assert row["url"] == "https://github.com/lay/clutch/pull/83"


def test_legacy_closed_and_merged_payload_reads_as_merged():
    raw = make_event(1, "PullRequestEvent", {
        "action": "closed", "number": 5,
        "pull_request": {"number": 5, "merged": True, "title": "Ship it"},
    })
    row = normalize_event(raw)
    assert (row["action"], row["title"]) == ("merged", "Ship it")


def test_review_and_review_comment_events():
    assert normalize_event(review_event(1, 40))["action"] == "reviewed"
    comment = normalize_event(make_event(2, "PullRequestReviewCommentEvent", {
        "pull_request": {"number": 40},
        "comment": {"html_url": "https://github.com/lay/clutch/pull/40#discussion_r1"},
    }))
    assert comment["action"] == "commented"
    assert comment["url"].endswith("#discussion_r1")


def test_issue_comment_carries_its_own_title():
    row = normalize_event(issue_comment_event(1, 9, "Convert popups to modals"))
    assert (row["subject_number"], row["title"]) == (9, "Convert popups to modals")
    assert row["url"].endswith("#issuecomment-1")


def test_create_event_for_a_branch_and_for_a_repository():
    branch = normalize_event(make_event(1, "CreateEvent", {"ref": "feat/timeline", "ref_type": "branch"}))
    repo = normalize_event(make_event(2, "CreateEvent", {"ref": None, "ref_type": "repository"}))
    assert branch["url"] == "https://github.com/lay/clutch/tree/feat/timeline"
    assert repo["url"] == "https://github.com/lay/clutch"


def test_unknown_event_types_are_kept_not_rejected():
    row = normalize_event(make_event(1, "SponsorshipEvent", {"anything": True}))
    assert (row["event_type"], row["action"], row["url"]) == ("SponsorshipEvent", None, "https://github.com/lay/clutch")


def test_privacy_and_timestamps():
    row = normalize_event(push(1, public=False, created_at="2026-09-12T22:04:01Z"))
    assert row["is_private"] is True
    assert row["occurred_at"] == parse_github_time("2026-09-12T22:04:01Z")
    assert row["occurred_at"].tzinfo == timezone.utc


def test_title_query_quotes_repository_names():
    query = build_title_query([("lay/clutch", 83), ("org/api", 40)])
    assert 'r0: repository(owner: "lay", name: "clutch")' in query
    assert "issueOrPullRequest(number: 40)" in query


# ---------------------------------------------------------------------------
# sync_activity_events
# ---------------------------------------------------------------------------

def test_sync_stores_events_and_fills_in_what_payloads_leave_out(db, user):
    github = FakeGitHub()
    github.event_pages[1] = [
        trimmed_pr_event(4, 83, "merged"),
        issue_comment_event(3, 9, "Convert popups to modals"),
        review_event(2, 40, repo="org/api"),
        push(1, before="a" * 40, head="c" * 40),
    ]
    github.compare[f"{'a' * 40}...{'c' * 40}"] = (200, compare_body("fix(frontend): stop sync wiping the page\n\nlong body", "chore: tidy"))
    github.titles[("lay/clutch", 83)] = "release: merge develop into main"
    github.titles[("org/api", 40)] = "Convert jQuery-UI popups to Bootstrap modals"

    result = run_sync(user, db, github)

    assert result == {"new_events": 4, "enriched": 4}
    stored = rows(db)
    assert stored["4"].title == "release: merge develop into main"
    assert stored["2"].title == "Convert jQuery-UI popups to Bootstrap modals"
    assert stored["3"].title == "Convert popups to modals"  # from the payload, no lookup
    assert [c["message"] for c in stored["1"].commits] == ["fix(frontend): stop sync wiping the page", "chore: tidy"]
    assert all(row.enriched_at is not None for row in stored.values())
    assert github.count("/graphql") == 1  # both titles resolved in one batched request


def test_titles_already_synced_as_pull_requests_skip_the_api(db, user):
    db.add(PullRequest(
        user_id=user.id, repo="lay/clutch", pr_number=83, title="From the PR table",
        state="MERGED", pr_created_at=parse_github_time("2026-09-12T21:00:00Z"),
    ))
    db.commit()
    github = FakeGitHub()
    github.event_pages[1] = [trimmed_pr_event(1, 83, "opened")]

    run_sync(user, db, github)

    assert rows(db)["1"].title == "From the PR table"
    assert github.count("/graphql") == 0


def test_second_sync_only_stores_new_events_and_stops_paging(db, user):
    github = FakeGitHub()
    github.event_pages[1] = [issue_comment_event(1, 9, "Old")]
    run_sync(user, db, github)

    github.calls.clear()
    github.event_pages[1] = [issue_comment_event(2, 10, "New"), issue_comment_event(1, 9, "Old")]
    result = run_sync(user, db, github)

    assert result["new_events"] == 1
    assert set(rows(db)) == {"1", "2"}
    assert github.count("/events") == 1


def test_a_temporary_lookup_failure_is_retried_on_the_next_sync(db, user):
    github = FakeGitHub()
    github.event_pages[1] = [push(1, before="a" * 40, head="c" * 40)]
    key = f"{'a' * 40}...{'c' * 40}"

    github.compare[key] = (503, {})
    run_sync(user, db, github)
    assert rows(db)["1"].enriched_at is None  # left pending, not given up on

    github.compare[key] = (200, compare_body("feat: timeline"))
    result = run_sync(user, db, github)
    assert result == {"new_events": 0, "enriched": 1}
    assert rows(db)["1"].commits == [{"sha": "s0", "message": "feat: timeline"}]


def test_a_permanently_unavailable_push_is_not_retried(db, user):
    github = FakeGitHub()
    github.event_pages[1] = [push(1, before="a" * 40, head="c" * 40)]  # compare and commit both 404

    run_sync(user, db, github)
    row = rows(db)["1"]
    assert row.enriched_at is not None and row.commits is None

    github.calls.clear()
    run_sync(user, db, github)
    assert github.count("/compare/") == 0 and github.count("/commits/") == 0


def test_a_push_to_a_new_branch_uses_the_head_commit_without_comparing(db, user):
    github = FakeGitHub()
    github.event_pages[1] = [push(1, before=ZERO_SHA, head="c" * 40)]
    github.commit["c" * 40] = (200, {"sha": "c" * 40, "commit": {"message": "feat: first commit"}})

    run_sync(user, db, github)

    assert rows(db)["1"].commits == [{"sha": "c" * 40, "message": "feat: first commit"}]
    assert github.count("/compare/") == 0


def test_a_failed_title_batch_stays_pending(db, user):
    github = FakeGitHub()
    github.event_pages[1] = [trimmed_pr_event(1, 83, "opened")]
    github.graphql_status = 502

    run_sync(user, db, github)

    assert rows(db)["1"].enriched_at is None


def test_github_refusing_the_first_page_raises(db, user):
    github = FakeGitHub()
    github.events_status = 401
    with pytest.raises(GitHubUnavailable):
        run_sync(user, db, github)


# ---------------------------------------------------------------------------
# Endpoint wiring
# ---------------------------------------------------------------------------

@pytest.fixture
def api(db, user):
    github = FakeGitHub()

    async def fake_client():
        async with github.client() as client:
            yield client

    fastapi_app.dependency_overrides[get_db] = lambda: db
    fastapi_app.dependency_overrides[get_current_user] = lambda: user
    fastapi_app.dependency_overrides[get_github_client] = fake_client
    yield TestClient(fastapi_app), github
    fastapi_app.dependency_overrides.clear()


def test_sync_endpoint_reports_what_it_did(api):
    client, github = api
    github.event_pages[1] = [issue_comment_event(1, 9, "Convert popups to modals")]

    response = client.post("/github/events/sync")

    assert response.status_code == 200
    assert response.json() == {"message": "Activity sync complete", "new_events": 1, "enriched": 1}


def test_sync_endpoint_turns_a_github_outage_into_a_502(api):
    client, github = api
    github.events_status = 503

    response = client.post("/github/events/sync")

    assert response.status_code == 502
    assert "Couldn't reach GitHub" in response.json()["detail"]
