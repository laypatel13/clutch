"""Tests for collapsing stored events into timeline items and paging through them."""

import itertools
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.dependencies import get_current_user
from app.main import app as fastapi_app
from app.models.activity_event import ActivityEvent
from app.models.user import User
from app.services.timeline import (
    InvalidCursor,
    build_item,
    collapse,
    decode_cursor,
    encode_cursor,
    load_timeline,
)

T0 = datetime(2026, 9, 12, 21, 7, tzinfo=timezone.utc)
_event_ids = itertools.count(20955000000)


# ---------------------------------------------------------------------------
# Builders. Event IDs increase with creation order, like GitHub's, so build
# events in the order they happened.
# ---------------------------------------------------------------------------

def event(event_type, minute, *, repo="lay/clutch", number=None, action=None, ref=None,
          title=None, commits=None, payload=None, url=None, private=False, seconds=0):
    return ActivityEvent(
        github_event_id=str(next(_event_ids)),
        event_type=event_type,
        action=action,
        repo=repo,
        subject_number=number,
        ref=ref,
        title=title,
        commits=commits,
        url=url or f"https://github.com/{repo}",
        is_private=private,
        occurred_at=T0 + timedelta(minutes=minute, seconds=seconds),
        raw_payload=payload or {},
    )


def pr(minute, number, action, title=None, repo="lay/clutch", **kwargs):
    return event("PullRequestEvent", minute, repo=repo, number=number, action=action, title=title,
                 url=f"https://github.com/{repo}/pull/{number}", **kwargs)


def review(minute, number, state="commented", repo="org/api", title=None, **kwargs):
    return event("PullRequestReviewEvent", minute, repo=repo, number=number, action="reviewed", title=title,
                 payload={"review": {"state": state}}, url=f"https://github.com/{repo}/pull/{number}", **kwargs)


def review_comment(minute, number, repo="org/api", **kwargs):
    return event("PullRequestReviewCommentEvent", minute, repo=repo, number=number, action="commented",
                 url=f"https://github.com/{repo}/pull/{number}#discussion_r1", **kwargs)


def comment(minute, number, title, repo="org/api", on_pull_request=True, **kwargs):
    kind = "pull" if on_pull_request else "issues"
    issue = {"number": number, "title": title}
    if on_pull_request:
        issue["pull_request"] = {"url": "https://api.github.com/x"}
    return event("IssueCommentEvent", minute, repo=repo, number=number, action="commented", title=title,
                 payload={"issue": issue}, url=f"https://github.com/{repo}/{kind}/{number}#issuecomment-1", **kwargs)


def push(minute, *messages, ref="develop", before=None, head=None, repo="lay/clutch", **kwargs):
    commits = [{"sha": f"{ref}-{minute}-{i}", "message": m} for i, m in enumerate(messages)] if messages else None
    before = before or f"before{minute}".ljust(40, "0")[:39] + "a"
    head = head or f"head{minute}".ljust(40, "0")[:39] + "b"
    return event("PushEvent", minute, repo=repo, ref=ref, commits=commits,
                 payload={"before": before, "head": head},
                 url=f"https://github.com/{repo}/compare/{before}...{head}", **kwargs)


def create(minute, ref, ref_type="branch", repo="lay/clutch", **kwargs):
    return event("CreateEvent", minute, repo=repo, ref=ref, action="created",
                 payload={"ref_type": ref_type}, url=f"https://github.com/{repo}/tree/{ref}", **kwargs)


def star(minute, repo, **kwargs):
    return event("WatchEvent", minute, repo=repo, action="starred", **kwargs)


def items_for(events):
    """Newest first, as the API returns them."""
    built = [build_item(group) for group in collapse(events)]
    return [item for item in reversed(built) if item is not None]


def summaries(events):
    return [item["summary"] for item in items_for(events)]


# ---------------------------------------------------------------------------
# The night from the real capture
# ---------------------------------------------------------------------------

def test_the_real_night_reads_as_four_lines():
    """Fourteen events captured on a real night, reduced to what actually happened."""
    night = [
        push(0, "refactor(frontend): consolidate ad-hoc styling into one design system"),
        review_comment(17, 6028), review(17, 6028), review_comment(17, 6028), review(17, 6028),
        review_comment(18, 6028), review(18, 6028),
        review_comment(21, 6028), review(21, 6028),
        comment(31, 6028, "Convert jQuery-UI popups to Bootstrap modals"),
        push(40, "fix(frontend): make layout responsive and stop the nav wrapping on mobile"),
        push(57, "fix(frontend): stop sync wiping the page and build a real motion layer"),
        pr(62, 83, "opened", title="release: merge develop into main"),
        pr(62, 83, "merged", title="release: merge develop into main", seconds=20),
    ]

    assert summaries(night) == [
        "Opened and merged PR #83 — release: merge develop into main",
        "Pushed 2 commits to develop — fix(frontend): stop sync wiping the page and build a real motion layer",
        "Reviewed PR #6028 — Convert jQuery-UI popups to Bootstrap modals (5 comments)",
        "Pushed 1 commit to develop — refactor(frontend): consolidate ad-hoc styling into one design system",
    ]
    review_item = items_for(night)[2]
    assert review_item["event_count"] == 9
    assert review_item["counts"] == {"comments": 5, "reviews": 4}
    assert review_item["url"] == "https://github.com/org/api/pull/6028"


# ---------------------------------------------------------------------------
# Session rules
# ---------------------------------------------------------------------------

def test_a_gap_of_exactly_thirty_minutes_still_joins():
    assert len(items_for([comment(0, 9, "T"), comment(30, 9, "T")])) == 1


def test_a_gap_over_thirty_minutes_starts_a_new_item():
    assert len(items_for([comment(0, 9, "T"), comment(31, 9, "T")])) == 2


def test_a_different_subject_in_between_splits_rather_than_reorders():
    events = [review(0, 40), push(1, "wip"), review(2, 40)]
    assert [item["kind"] for item in items_for(events)] == ["pull_request", "branch", "pull_request"]


def test_same_number_in_different_repositories_never_joins():
    assert len(items_for([comment(0, 9, "A", repo="org/one"), comment(1, 9, "B", repo="org/two")])) == 2


def test_long_uninterrupted_sessions_stay_one_item():
    # Pairwise gaps, not a cap on total length: steady pushes all afternoon with
    # nothing else in between really were one continuous stretch of work.
    events = [push(minute, f"commit {minute}") for minute in range(0, 300, 25)]
    assert len(items_for(events)) == 1


# ---------------------------------------------------------------------------
# Pull requests and issues
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("events, expected", [
    ([pr(0, 5, "merged", title="Ship it")], "Merged PR #5 — Ship it"),
    ([pr(0, 5, "opened"), pr(1, 5, "closed")], "Opened and closed PR #5"),
    ([pr(0, 5, "reopened", title="Back")], "Reopened PR #5 — Back"),
    ([review(0, 40, state="APPROVED", title="Add cache")], "Approved PR #40 — Add cache"),
    ([review(0, 40, state="changes_requested", title="Add cache")], "Requested changes on PR #40 — Add cache"),
    ([review(0, 40), review(1, 40, state="approved")], "Approved PR #40"),
])
def test_pull_request_headlines(events, expected):
    assert summaries(events) == [expected]


def test_a_merge_outranks_the_review_before_it():
    events = [review(0, 7, repo="lay/clutch"), review_comment(1, 7, repo="lay/clutch"), pr(2, 7, "merged", title="T")]
    assert summaries(events) == ["Merged PR #7 — T (1 comment)"]


def test_a_single_comment_links_to_the_comment_itself():
    [item] = items_for([comment(0, 9, "Crash on login", on_pull_request=False)])
    assert item["summary"] == "Commented on issue #9 — Crash on login"
    assert item["kind"] == "issue"
    assert item["url"].endswith("#issuecomment-1")


def test_several_comments_link_to_the_conversation_and_are_counted():
    [item] = items_for([comment(0, 9, "Crash", on_pull_request=False), comment(5, 9, "Crash", on_pull_request=False)])
    assert item["summary"] == "Commented on issue #9 — Crash (2 comments)"
    assert item["url"] == "https://github.com/org/api/issues/9"


def test_a_comment_on_a_pull_request_is_labelled_as_one():
    assert summaries([comment(0, 6028, "Convert popups")]) == ["Commented on PR #6028 — Convert popups"]


def test_an_opened_issue_and_a_non_comment_change():
    opened = event("IssuesEvent", 0, number=55, action="opened", title="Flaky test")
    labeled = event("IssuesEvent", 0, number=56, action="labeled", title="Docs", repo="org/other")
    assert summaries([opened]) == ["Opened issue #55 — Flaky test"]
    assert summaries([labeled]) == ["Updated issue #56 — Docs"]


def test_a_thread_without_a_title_yet_still_reads_cleanly():
    assert summaries([pr(0, 83, "merged")]) == ["Merged PR #83"]


def test_long_titles_are_truncated():
    [line] = summaries([pr(0, 1, "merged", title="x" * 200)])
    assert line.endswith("…") and len(line) <= len("Merged PR #1 — ") + 72


# ---------------------------------------------------------------------------
# Pushes and branches
# ---------------------------------------------------------------------------

def test_pushes_merge_commits_newest_first_and_link_the_whole_range():
    first = push(0, "one", "two", before="a" * 40, head="b" * 40)
    second = push(10, "three", before="b" * 40, head="c" * 40)
    [item] = items_for([first, second])

    assert item["summary"] == "Pushed 3 commits to develop — three"
    assert [c["message"] for c in item["commits"]] == ["three", "two", "one"]
    assert item["url"] == f"https://github.com/lay/clutch/compare/{'a' * 40}...{'c' * 40}"
    assert item["counts"] == {"commits": 3, "pushes": 2}
    assert item["commits"][0]["url"].startswith("https://github.com/lay/clutch/commit/")


def test_a_commit_reported_by_two_pushes_is_counted_once():
    first = push(0, "shared")
    second = push(5, "shared", "new")
    second.commits[0]["sha"] = first.commits[0]["sha"]
    [item] = items_for([first, second])
    assert item["counts"]["commits"] == 2


def test_commit_list_is_capped_but_the_count_is_not():
    [item] = items_for([push(0, *[f"c{i}" for i in range(9)])])
    assert item["counts"]["commits"] == 9 and len(item["commits"]) == 5


def test_creating_a_branch_and_pushing_to_it_is_one_act():
    events = [create(0, "feat/timeline"), push(0, "feat: add timeline", ref="feat/timeline", seconds=5)]
    assert summaries(events) == ["Pushed 1 commit to new branch feat/timeline — feat: add timeline"]


def test_a_branch_created_without_a_push():
    assert summaries([create(0, "feat/idea")]) == ["Created branch feat/idea"]


def test_a_push_not_enriched_yet_degrades_gracefully():
    [item] = items_for([push(0)])
    assert item["summary"] == "Pushed to develop"
    assert item["commits"] == []


def test_pushes_to_different_branches_stay_separate():
    assert len(items_for([push(0, "a", ref="main"), push(1, "b", ref="develop")])) == 2


# ---------------------------------------------------------------------------
# Everything else
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("stars, expected", [
    (["scummvm/scummvm"], "Starred scummvm/scummvm"),
    (["a/one", "b/two"], "Starred b/two and a/one"),
    (["a/one", "b/two", "c/three"], "Starred c/three and 2 others"),
])
def test_consecutive_stars_collapse(stars, expected):
    events = [star(i, repo) for i, repo in enumerate(stars)]
    [item] = items_for(events)
    assert item["summary"] == expected
    assert item["repos"] == list(reversed(stars))


def test_other_single_events():
    events = [
        create(0, "v1.0", ref_type="tag"),
        create(100, None, ref_type="repository", repo="lay/newthing"),
        event("DeleteEvent", 200, ref="feat/old", action="deleted", payload={"ref_type": "branch"}),
        event("ForkEvent", 300, repo="org/api", action="forked", url="https://github.com/lay/api"),
        event("ReleaseEvent", 400, action="published", title="v1.0"),
    ]
    assert summaries(events) == [
        "Published release v1.0",
        "Forked org/api",
        "Deleted branch feat/old",
        "Created repository lay/newthing",
        "Created tag v1.0",
    ]


def test_an_item_is_private_if_any_of_its_events_are():
    [item] = items_for([comment(0, 9, "T"), comment(1, 9, "T", private=True)])
    assert item["is_private"] is True


def test_item_timestamps_span_the_session_in_utc():
    [item] = items_for([comment(0, 9, "T"), comment(20, 9, "T")])
    assert item["started_at"] == "2026-09-12T21:07:00+00:00"
    assert item["ended_at"] == "2026-09-12T21:27:00+00:00"


def test_cursor_round_trips():
    sample = push(0)
    assert decode_cursor(encode_cursor(sample)) == (sample.occurred_at, int(sample.github_event_id))


def test_a_malformed_cursor_is_rejected():
    with pytest.raises(InvalidCursor):
        decode_cursor("not-a-real-cursor")


# ---------------------------------------------------------------------------
# Paging through the database
# ---------------------------------------------------------------------------

def store(db, user, events):
    for item in events:
        item.user_id = user.id
        db.add(item)
    db.commit()


def walk_pages(db, user, limit):
    pages, cursor = [], None
    while True:
        page = load_timeline(db, user.id, cursor=cursor, limit=limit)
        pages.append(page["items"])
        cursor = page["next_cursor"]
        if cursor is None:
            return pages


def test_paging_visits_every_item_once_newest_first(db, user):
    store(db, user, [push(minute, f"c{minute}", ref=f"branch-{minute}") for minute in range(60)])

    pages = walk_pages(db, user, limit=25)

    assert [len(page) for page in pages] == [25, 25, 10]
    flat = [item for page in pages for item in page]
    assert len({item["id"] for item in flat}) == 60
    started = [item["started_at"] for item in flat]
    assert started == sorted(started, reverse=True)


def test_a_session_on_a_page_boundary_is_never_split(db, user):
    session = [review(minute, 6028) for minute in range(10)]
    newer = [push(20 + minute, "x", ref=f"branch-{minute}") for minute in range(3)]
    store(db, user, session + newer)

    first = load_timeline(db, user.id, limit=5)  # 3 pushes + only 2 of the 10 reviews

    assert [item["kind"] for item in first["items"]] == ["branch", "branch", "branch", "pull_request"]
    assert first["items"][-1]["event_count"] == 10
    assert first["next_cursor"] is None  # nothing older remains


def test_events_sharing_a_timestamp_are_not_skipped_between_pages(db, user):
    same_second = [create(5, f"v{i}", ref_type="tag") for i in range(3)]
    store(db, user, [create(0, "v-old", ref_type="tag")] + same_second)

    pages = walk_pages(db, user, limit=1)

    assert [item["summary"] for page in pages for item in page] == [
        "Created tag v2", "Created tag v1", "Created tag v0", "Created tag v-old",
    ]


def test_unrecognised_events_are_hidden_and_do_not_split_a_session(db, user):
    store(db, user, [review(0, 40), event("SponsorshipEvent", 1), review(2, 40)])

    items = load_timeline(db, user.id)["items"]

    assert len(items) == 1 and items[0]["event_count"] == 2


def test_only_the_requesting_users_events_are_returned(db, user):
    other = User(github_id=2, username="someone-else")
    db.add(other)
    db.commit()
    store(db, user, [push(0, "mine")])
    store(db, other, [push(1, "theirs", ref="main")])

    assert summaries_of(load_timeline(db, user.id)) == ["Pushed 1 commit to develop — mine"]


def summaries_of(page):
    return [item["summary"] for item in page["items"]]


def test_an_empty_timeline(db, user):
    assert load_timeline(db, user.id) == {"items": [], "next_cursor": None}


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@pytest.fixture
def api(db, user):
    fastapi_app.dependency_overrides[get_db] = lambda: db
    fastapi_app.dependency_overrides[get_current_user] = lambda: user
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()


def test_timeline_endpoint_pages_with_the_cursor(api, db, user):
    store(db, user, [push(minute, f"c{minute}", ref=f"branch-{minute}") for minute in range(3)])

    first = api.get("/github/timeline", params={"limit": 2}).json()
    second = api.get("/github/timeline", params={"limit": 2, "cursor": first["next_cursor"]}).json()

    assert [i["summary"] for i in first["items"]] == ["Pushed 1 commit to branch-2 — c2", "Pushed 1 commit to branch-1 — c1"]
    assert [i["summary"] for i in second["items"]] == ["Pushed 1 commit to branch-0 — c0"]
    assert second["next_cursor"] is None


def test_timeline_endpoint_rejects_a_bad_cursor(api):
    response = api.get("/github/timeline", params={"cursor": "garbage"})
    assert response.status_code == 400


@pytest.mark.parametrize("limit", [0, 101])
def test_timeline_endpoint_bounds_the_page_size(api, limit):
    assert api.get("/github/timeline", params={"limit": limit}).status_code == 422
