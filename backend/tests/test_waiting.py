"""Tests for classifying open pull requests into what's waiting on the user."""

import asyncio
import json
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_current_user, get_github_client
from app.main import app as fastapi_app
from app.services.activity_sync import GitHubUnavailable
from app.services.waiting import classify, fetch_waiting

NOW = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)


def ago(days=0, hours=0) -> str:
    return (NOW - timedelta(days=days, hours=hours)).isoformat().replace("+00:00", "Z")


# ---------------------------------------------------------------------------
# Builders shaped like the GraphQL nodes GitHub returns
# ---------------------------------------------------------------------------

def mine(number, *, repo="lay/clutch", updated=0, decision=None, permission="ADMIN", reviews=(),
         last_commit=None, draft=False, title="A pull request"):
    return {
        "number": number,
        "title": title,
        "url": f"https://github.com/{repo}/pull/{number}",
        "isDraft": draft,
        "updatedAt": ago(updated),
        "reviewDecision": decision,
        "repository": {"nameWithOwner": repo, "viewerPermission": permission},
        "commits": {"nodes": [{"commit": {"committedDate": ago(last_commit)}}] if last_commit is not None else []},
        "latestOpinionatedReviews": {"nodes": [
            {"state": state, "submittedAt": ago(days), "author": {"login": by}} for state, days, by in reviews
        ]},
    }


def theirs(number, *, repo="org/api", updated=0, author="alice", requests=(), draft=False, title="Add rate limiting"):
    return {
        "number": number,
        "title": title,
        "url": f"https://github.com/{repo}/pull/{number}",
        "isDraft": draft,
        "updatedAt": ago(updated),
        "author": {"login": author},
        "repository": {"nameWithOwner": repo},
        "timelineItems": {"nodes": [
            {"createdAt": ago(days), "requestedReviewer": {"login": who}} for who, days in requests
        ]},
    }


def landed(number, *, repo="lay/clutch", merged=1, merged_by="lay", title="A pull request"):
    return {
        "number": number,
        "title": title,
        "url": f"https://github.com/{repo}/pull/{number}",
        "mergedAt": ago(merged),
        "mergedBy": {"login": merged_by} if merged_by else None,
        "repository": {"nameWithOwner": repo},
    }


def run(authored=(), requested=(), merged=()):
    return classify(list(authored), list(requested), "lay", NOW, merged=list(merged))


def where(sections, repo_number):
    return [name for name, items in sections.items() if any(i["id"] == repo_number for i in items)]


# ---------------------------------------------------------------------------
# The real data this was calibrated on
# ---------------------------------------------------------------------------

def test_quiet_means_no_activity_not_old():
    """Real open PRs from the calibration check, and where each belongs."""
    sections = run(authored=[
        mine(5984, repo="learning-unlimited/ESP-Website", updated=0, permission="READ"),   # opened 11d ago, active today
        mine(14472, repo="wagtail/wagtail", updated=38, permission="READ"),
        mine(53, repo="elite-coders-xyz/Open-Source-Hackathon-Submissions", updated=92, permission="READ"),
        mine(6004, repo="learning-unlimited/ESP-Website", updated=6, permission="READ"),
    ])

    # The old rule flagged #5984 as stale because it was opened 11 days ago.
    assert where(sections, "learning-unlimited/ESP-Website#5984") == []
    assert where(sections, "wagtail/wagtail#14472") == ["gone_quiet"]
    assert where(sections, "elite-coders-xyz/Open-Source-Hackathon-Submissions#53") == ["probably_abandoned"]
    assert where(sections, "learning-unlimited/ESP-Website#6004") == []


# ---------------------------------------------------------------------------
# Review requests
# ---------------------------------------------------------------------------

def test_review_request_age_counts_from_your_latest_request():
    pr = theirs(41, updated=0, requests=[("lay", 6), ("bob", 1), ("lay", 2)])
    [item] = run(requested=[pr])["review_requested"]
    assert item["since"] == ago(2).replace("Z", "+00:00")
    assert item["summary"] == "Review PR #41 — Add rate limiting"
    assert item["detail"] == "opened by alice"


def test_review_request_through_a_team_falls_back_to_last_activity():
    pr = theirs(41, updated=3, requests=[("platform-team-member", 1)])
    [item] = run(requested=[pr])["review_requested"]
    assert item["since"] == ago(3).replace("Z", "+00:00")


# ---------------------------------------------------------------------------
# Your pull requests
# ---------------------------------------------------------------------------

def test_approved_and_mergeable_is_ready_to_merge():
    pr = mine(80, decision="APPROVED", reviews=[("APPROVED", 1, "bob")], updated=1)
    [item] = run(authored=[pr])["ready_to_merge"]
    assert item["summary"] == "Merge PR #80 — A pull request"
    assert item["detail"] == "approved by bob"


def test_approved_without_merge_rights_waits_on_a_maintainer_not_you():
    """ESP-Website #6004: approved by a reviewer, but only maintainers can merge."""
    fresh = mine(6004, repo="learning-unlimited/ESP-Website", decision="APPROVED", permission="READ",
                 reviews=[("APPROVED", 1, "Oval17")], updated=1, title="Add footer styling")
    stalled = mine(81, decision="APPROVED", permission="READ", reviews=[("APPROVED", 20, "bob")], updated=20)
    sections = run(authored=[fresh, stalled])

    # Approval is more useful to surface than the silence that follows it.
    assert where(sections, "learning-unlimited/ESP-Website#6004") == ["awaiting_maintainer"]
    assert where(sections, "lay/clutch#81") == ["awaiting_maintainer"]
    item = next(i for i in sections["awaiting_maintainer"] if i["number"] == 6004)
    assert item["summary"] == "Approved: PR #6004 — Add footer styling"
    assert item["detail"] == "approved by Oval17"


def test_changes_you_have_not_pushed_since_are_waiting_on_you():
    pr = mine(80, decision="CHANGES_REQUESTED", reviews=[("CHANGES_REQUESTED", 2, "bob")], last_commit=3, updated=2)
    [item] = run(authored=[pr])["changes_requested"]
    assert item["summary"] == "Address changes on PR #80 — A pull request"
    assert item["detail"] == "requested by bob"


def test_changes_you_already_pushed_hand_the_move_to_the_reviewer():
    recent = mine(80, decision="CHANGES_REQUESTED", reviews=[("CHANGES_REQUESTED", 5, "bob")], last_commit=4, updated=4)
    stalled = mine(81, decision="CHANGES_REQUESTED", reviews=[("CHANGES_REQUESTED", 12, "bob")], last_commit=10, updated=10)
    sections = run(authored=[recent, stalled])
    assert where(sections, "lay/clutch#80") == []
    assert where(sections, "lay/clutch#81") == ["gone_quiet"]


@pytest.mark.parametrize("reviews, expected", [
    ([("APPROVED", 1, "bob")], "ready_to_merge"),
    ([("APPROVED", 1, "bob"), ("CHANGES_REQUESTED", 1, "carol")], "changes_requested"),
])
def test_repositories_without_required_reviews_derive_the_decision(reviews, expected):
    pr = mine(80, decision=None, reviews=reviews, updated=1)
    assert where(run(authored=[pr]), "lay/clutch#80") == [expected]


def test_a_pull_request_lands_in_one_section_only():
    pr = mine(80, decision="APPROVED", reviews=[("APPROVED", 20, "bob")], updated=20)
    assert where(run(authored=[pr]), "lay/clutch#80") == ["ready_to_merge"]


def test_drafts_are_never_waiting():
    sections = run(
        authored=[mine(80, updated=30, draft=True)],
        requested=[theirs(41, requests=[("lay", 1)], draft=True)],
    )
    assert all(items == [] for items in sections.values())


@pytest.mark.parametrize("days, hours, expected", [
    (6, 23, []),
    (7, 0, ["gone_quiet"]),
    (59, 23, ["gone_quiet"]),
    (60, 0, ["probably_abandoned"]),
])
def test_quiet_thresholds(days, hours, expected):
    pr = mine(80)
    pr["updatedAt"] = ago(days, hours)
    assert where(run(authored=[pr]), "lay/clutch#80") == expected


def test_oldest_waiting_comes_first():
    sections = run(authored=[mine(1, updated=8), mine(2, updated=20), mine(3, updated=12)])
    assert [item["number"] for item in sections["gone_quiet"]] == [2, 3, 1]


def test_long_titles_are_truncated_and_missing_titles_read_cleanly():
    long = mine(1, updated=9, title="x" * 200)
    untitled = mine(2, updated=9, title=None)
    items = {item["number"]: item for item in run(authored=[long, untitled])["gone_quiet"]}
    assert items[1]["summary"].endswith("…")
    assert items[2]["summary"] == "Follow up on PR #2"


def test_null_and_non_pull_request_search_nodes_are_skipped():
    sections = run(authored=[None, {}, mine(1, updated=9)], requested=[None, {}], merged=[None, {}])
    assert [item["number"] for item in sections["gone_quiet"]] == [1]
    assert sections["recently_merged"] == []


# ---------------------------------------------------------------------------
# Recently merged
# ---------------------------------------------------------------------------

def test_merged_pull_requests_are_listed_most_recent_first():
    sections = run(merged=[landed(1, merged=12), landed(2, merged=2), landed(3, merged=25)])
    items = sections["recently_merged"]
    assert [item["number"] for item in items] == [2, 1, 3]
    assert items[0]["summary"] == "Merged PR #2 — A pull request"
    assert items[0]["since"] == ago(2).replace("Z", "+00:00")


@pytest.mark.parametrize("merged_by, detail", [
    ("bob", "merged by bob"),
    ("lay", None),
    ("LAY", None),
    (None, None),
])
def test_merged_names_the_merger_only_when_it_was_someone_else(merged_by, detail):
    [item] = run(merged=[landed(1, merged_by=merged_by)])["recently_merged"]
    assert item["detail"] == detail


@pytest.mark.parametrize("days, hours, listed", [
    (29, 23, True),
    (30, 0, True),
    (30, 1, False),
])
def test_merged_window_is_exact_even_though_search_is_by_date(days, hours, listed):
    pr = landed(1)
    pr["mergedAt"] = ago(days, hours)
    assert (run(merged=[pr])["recently_merged"] != []) == listed


def test_merged_pull_requests_never_count_as_open_loops():
    sections = run(merged=[landed(1)])
    assert where(sections, "lay/clutch#1") == ["recently_merged"]


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

def graphql(status=200, body=None, calls=None):
    def handler(request: httpx.Request) -> httpx.Response:
        if calls is not None:
            calls.append(json.loads(request.read()))
        return httpx.Response(status, json=body if body is not None else {})
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def fetch(client):
    async def go():
        async with client:
            return await fetch_waiting(client, "lay", now=NOW)
    return asyncio.run(go())


def test_fetch_asks_for_direct_review_requests_and_recent_merges_in_one_request():
    calls = []
    body = {"data": {
        "authored": {"nodes": [mine(1, updated=9)]},
        "requested": {"nodes": []},
        "merged": {"nodes": [landed(2, merged=3)]},
    }}

    result = fetch(graphql(body=body, calls=calls))

    assert len(calls) == 1
    variables = calls[0]["variables"]
    assert "user-review-requested:lay" in variables["requested"]
    assert "is:merged author:lay merged:>=2026-08-16" in variables["merged"]
    assert result["checked_at"] == NOW.isoformat()
    assert [item["number"] for item in result["sections"]["gone_quiet"]] == [1]
    assert [item["number"] for item in result["sections"]["recently_merged"]] == [2]


def test_fetch_tolerates_a_response_without_merges():
    body = {"data": {"authored": {"nodes": []}, "requested": {"nodes": []}}}
    assert fetch(graphql(body=body))["sections"]["recently_merged"] == []


@pytest.mark.parametrize("status, body", [
    (502, {}),
    (200, {"errors": [{"message": "Bad credentials"}]}),
])
def test_fetch_raises_when_github_gives_nothing_usable(status, body):
    with pytest.raises(GitHubUnavailable):
        fetch(graphql(status=status, body=body))


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@pytest.fixture
def api(user):
    responses = {}

    async def fake_client():
        async with graphql(**responses) as client:
            yield client

    fastapi_app.dependency_overrides[get_current_user] = lambda: user
    fastapi_app.dependency_overrides[get_github_client] = fake_client
    yield TestClient(fastapi_app), responses
    fastapi_app.dependency_overrides.clear()


def test_waiting_endpoint_returns_every_section(api):
    client, responses = api
    responses["body"] = {"data": {"authored": {"nodes": []}, "requested": {"nodes": []}}}

    response = client.get("/github/waiting")

    assert response.status_code == 200
    assert set(response.json()["sections"]) == {
        "review_requested", "ready_to_merge", "changes_requested",
        "gone_quiet", "probably_abandoned", "awaiting_maintainer", "recently_merged",
    }


def test_waiting_endpoint_turns_a_github_failure_into_a_502(api):
    client, responses = api
    responses["status"] = 503

    assert client.get("/github/waiting").status_code == 502
