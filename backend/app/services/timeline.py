"""Turn stored GitHub events into a readable timeline.

GitHub records work as a stream of tiny events: one sitting of reviewing a PR
arrives as a review event, a review-comment event and an issue-comment event
per reply, and opening and merging a PR a minute apart arrives as two. Shown
raw, that stream is a log. This module collapses it into items a person would
recognise as "things I did", each with a finished one-line summary.

The collapsing rule is deliberately simple and pairwise: an event joins the
item before it when both are about the same subject and it happened within
SESSION_GAP of the previous event. Consecutive only — anything about a
different subject in between starts a new item, so nothing is ever reordered.
Because the rule only ever compares neighbours, a page boundary can be closed
by looking one event further back, and pages never disagree about where an
item starts.

What this module never does is decide what "today" is. Timestamps go out as
UTC; the client groups items into days in the viewer's own timezone.
"""

import base64
import binascii
from datetime import datetime, timedelta, timezone

from sqlalchemy import BigInteger, and_, cast, or_
from sqlalchemy.orm import Session

from app.models.activity_event import ActivityEvent

WEB_URL = "https://github.com"

SESSION_GAP = timedelta(minutes=30)
MAX_COMMITS_PER_ITEM = 5
SUMMARY_MESSAGE_LENGTH = 72
BOUNDARY_LOOKBACK_BATCH = 20

THREAD_EVENTS = {
    "PullRequestEvent",
    "PullRequestReviewEvent",
    "PullRequestReviewCommentEvent",
    "IssueCommentEvent",
    "IssuesEvent",
}
PULL_REQUEST_ONLY_EVENTS = {"PullRequestEvent", "PullRequestReviewEvent", "PullRequestReviewCommentEvent"}

# Event types the timeline knows how to describe. Anything else is stored by the
# sync but left out here, so an unfamiliar type neither renders as noise nor
# splits a session it happens to sit in the middle of.
VISIBLE_EVENTS = THREAD_EVENTS | {
    "PushEvent",
    "CreateEvent",
    "DeleteEvent",
    "WatchEvent",
    "ForkEvent",
    "ReleaseEvent",
}


class InvalidCursor(ValueError):
    pass


# ---------------------------------------------------------------------------
# Ordering and cursors
# ---------------------------------------------------------------------------

def as_utc(value: datetime) -> datetime:
    """SQLite hands timezone-aware columns back naive; every stored value is UTC."""
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def chronological_key(event) -> tuple[datetime, int]:
    # Several events can share a timestamp to the second. GitHub's event IDs
    # increase over time, so they break the tie in true order.
    return as_utc(event.occurred_at), int(event.github_event_id)


def encode_cursor(event) -> str:
    occurred_at, event_id = chronological_key(event)
    raw = f"{occurred_at.isoformat()}|{event_id}".encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, int]:
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        occurred_at, event_id = base64.urlsafe_b64decode(padded).decode().split("|")
        return as_utc(datetime.fromisoformat(occurred_at)), int(event_id)
    except (binascii.Error, UnicodeDecodeError, ValueError) as error:
        raise InvalidCursor(cursor) from error


# ---------------------------------------------------------------------------
# Collapsing — pure functions over anything shaped like an ActivityEvent
# ---------------------------------------------------------------------------

def _payload(event) -> dict:
    return event.raw_payload or {}


def subject_key(event) -> tuple:
    """What an event is about. Only events with equal keys can share an item."""
    if event.event_type in THREAD_EVENTS and event.subject_number is not None:
        # Issues and PRs share one number sequence per repository, and PR
        # conversation comments arrive as IssueCommentEvent — so keying on the
        # number is what folds reviews and comments on one PR together.
        return ("thread", event.repo, event.subject_number)
    if event.event_type == "PushEvent":
        return ("branch", event.repo, event.ref)
    if event.event_type == "CreateEvent" and _payload(event).get("ref_type") == "branch":
        # Creating a branch and pushing to it are one act from the user's side.
        return ("branch", event.repo, event.ref)
    if event.event_type == "WatchEvent":
        return ("stars",)
    return ("single", event.github_event_id)


def continues(earlier, later) -> bool:
    """Whether `later` belongs to the same item as the event just before it."""
    if subject_key(earlier) != subject_key(later):
        return False
    gap = as_utc(later.occurred_at) - as_utc(earlier.occurred_at)
    return timedelta(0) <= gap <= SESSION_GAP


def collapse(events: list) -> list[list]:
    """Group chronologically ordered events into items."""
    groups: list[list] = []
    for event in events:
        if groups and continues(groups[-1][-1], event):
            groups[-1].append(event)
        else:
            groups.append([event])
    return groups


def _plural(count: int, word: str) -> str:
    return f"{count} {word}{'' if count == 1 else 's'}"


def _truncate(text: str, length: int = SUMMARY_MESSAGE_LENGTH) -> str:
    return text if len(text) <= length else text[: length - 1].rstrip() + "…"


def _thread_is_pull_request(events) -> bool:
    for event in events:
        if event.event_type in PULL_REQUEST_ONLY_EVENTS:
            return True
        issue = _payload(event).get("issue") or {}
        if "pull_request" in issue or "/pull/" in (event.url or ""):
            return True
    return False


# Headline wording per action, in order of precedence: a merge outranks the
# review that preceded it, which outranks a passing comment.
_THREAD_VERBS = {
    "opened_and_merged": "Opened and merged",
    "merged": "Merged",
    "opened_and_closed": "Opened and closed",
    "closed": "Closed",
    "opened": "Opened",
    "reopened": "Reopened",
    "approved": "Approved",
    "changes_requested": "Requested changes on",
    "reviewed": "Reviewed",
    "commented": "Commented on",
    "updated": "Updated",
}


def _thread_action(events) -> str:
    lifecycle = {e.action for e in events if e.event_type in ("PullRequestEvent", "IssuesEvent")}
    review_states = {
        (_payload(e).get("review") or {}).get("state", "").lower()
        for e in events
        if e.event_type == "PullRequestReviewEvent"
    }
    was_reviewed = any(e.event_type in ("PullRequestReviewEvent", "PullRequestReviewCommentEvent") for e in events)

    if "merged" in lifecycle:
        return "opened_and_merged" if "opened" in lifecycle else "merged"
    if "closed" in lifecycle:
        return "opened_and_closed" if "opened" in lifecycle else "closed"
    if "opened" in lifecycle:
        return "opened"
    if "reopened" in lifecycle:
        return "reopened"
    if "approved" in review_states:
        return "approved"
    if "changes_requested" in review_states:
        return "changes_requested"
    if was_reviewed:
        return "reviewed"
    if any(e.event_type == "IssueCommentEvent" for e in events):
        return "commented"
    # e.g. an issue labeled or assigned — something changed, but not a comment.
    return "updated"


def _thread_item(events) -> dict:
    first = events[0]
    is_pull_request = _thread_is_pull_request(events)
    noun = "PR" if is_pull_request else "issue"
    number = first.subject_number
    title = next((e.title for e in events if e.title), None)
    action = _thread_action(events)

    comments = sum(e.event_type in ("PullRequestReviewCommentEvent", "IssueCommentEvent") for e in events)
    reviews = sum(e.event_type == "PullRequestReviewEvent" for e in events)

    summary = f"{_THREAD_VERBS[action]} {noun} #{number}"
    if title:
        summary += f" — {_truncate(title)}"
    # A lone comment is already described by "Commented on"; the count only
    # adds information when it isn't implied by the headline.
    if comments > 1 or (comments == 1 and action != "commented"):
        summary += f" ({_plural(comments, 'comment')})"

    # A single event links to exactly where it happened (a specific comment);
    # a session links to the conversation as a whole.
    url = first.url if len(events) == 1 else f"{WEB_URL}/{first.repo}/{'pull' if is_pull_request else 'issues'}/{number}"

    return {
        "kind": "pull_request" if is_pull_request else "issue",
        "action": action,
        "summary": summary,
        "title": title,
        "subject_number": number,
        "ref": None,
        "url": url,
        "counts": {"comments": comments, "reviews": reviews},
        "commits": [],
    }


def _branch_item(events) -> dict:
    first = events[0]
    repo, branch = first.repo, first.ref
    pushes = [e for e in events if e.event_type == "PushEvent"]
    created = any(e.event_type == "CreateEvent" for e in events)
    where = f"new branch {branch}" if created else branch

    if not pushes:
        return {
            "kind": "branch",
            "action": "created",
            "summary": f"Created branch {branch}",
            "title": None,
            "subject_number": None,
            "ref": branch,
            "url": first.url,
            "counts": {"commits": 0, "pushes": 0},
            "commits": [],
        }

    # Merged across pushes oldest-first, keeping each SHA once: a rebase or a
    # merge from main can report the same commit in more than one push.
    ordered: dict[str, str] = {}
    for push in pushes:
        for commit in push.commits or []:
            ordered.pop(commit["sha"], None)
            ordered[commit["sha"]] = commit["message"]
    newest_first = list(reversed(ordered.items()))

    if newest_first:
        summary = f"Pushed {_plural(len(newest_first), 'commit')} to {where} — {_truncate(newest_first[0][1])}"
    else:
        # Not enriched yet, or the commits are no longer reachable.
        summary = f"Pushed to {where}"

    if len(pushes) == 1:
        url = pushes[0].url
    else:
        before, head = _payload(pushes[0]).get("before"), _payload(pushes[-1]).get("head")
        url = (
            f"{WEB_URL}/{repo}/compare/{before}...{head}"
            if before and set(before) != {"0"} and head
            else f"{WEB_URL}/{repo}/tree/{branch}"
        )

    return {
        "kind": "branch",
        "action": "pushed",
        "summary": summary,
        "title": None,
        "subject_number": None,
        "ref": branch,
        "url": url,
        "counts": {"commits": len(newest_first), "pushes": len(pushes)},
        "commits": [
            {"sha": sha, "message": message, "url": f"{WEB_URL}/{repo}/commit/{sha}"}
            for sha, message in newest_first[:MAX_COMMITS_PER_ITEM]
        ],
    }


def _stars_item(events) -> dict:
    repos = list(dict.fromkeys(e.repo for e in reversed(events)))  # newest first, unique
    if len(repos) == 1:
        summary = f"Starred {repos[0]}"
    elif len(repos) == 2:
        summary = f"Starred {repos[0]} and {repos[1]}"
    else:
        summary = f"Starred {repos[0]} and {len(repos) - 1} others"
    return {
        "kind": "star",
        "action": "starred",
        "summary": summary,
        "title": None,
        "subject_number": None,
        "ref": None,
        "url": f"{WEB_URL}/{repos[0]}",
        "counts": {"repositories": len(repos)},
        "repos": repos,
        "commits": [],
    }


def _single_item(event) -> dict | None:
    payload = _payload(event)
    base = {"title": event.title, "subject_number": None, "ref": event.ref, "url": event.url, "counts": {}, "commits": []}

    if event.event_type == "CreateEvent":
        ref_type = payload.get("ref_type")
        if ref_type == "repository":
            return {**base, "kind": "repository", "action": "created", "summary": f"Created repository {event.repo}"}
        return {**base, "kind": "tag", "action": "created", "summary": f"Created tag {event.ref}"}

    if event.event_type == "DeleteEvent":
        ref_type = payload.get("ref_type") or "branch"
        return {**base, "kind": "delete", "action": "deleted", "summary": f"Deleted {ref_type} {event.ref}"}

    if event.event_type == "ForkEvent":
        return {**base, "kind": "fork", "action": "forked", "summary": f"Forked {event.repo}"}

    if event.event_type == "ReleaseEvent":
        verb = (event.action or "published").replace("_", " ").capitalize()
        name = f" {event.title}" if event.title else ""
        return {**base, "kind": "release", "action": event.action or "published", "summary": f"{verb} release{name}"}

    return None


def build_item(events: list) -> dict | None:
    """Describe one collapsed group. Returns None for groups the timeline hides."""
    first, last = events[0], events[-1]
    kind_of_subject = subject_key(first)[0]

    if kind_of_subject == "thread":
        item = _thread_item(events)
    elif kind_of_subject == "branch":
        item = _branch_item(events)
    elif kind_of_subject == "stars":
        item = _stars_item(events)
    else:
        item = _single_item(first)
        if item is None:
            return None

    return {
        "id": first.github_event_id,
        **item,
        "repo": first.repo,
        "started_at": as_utc(first.occurred_at).isoformat(),
        "ended_at": as_utc(last.occurred_at).isoformat(),
        "event_count": len(events),
        "is_private": any(e.is_private for e in events),
    }


# ---------------------------------------------------------------------------
# Reading a page
# ---------------------------------------------------------------------------

def _visible_events(db: Session, user_id: int):
    return (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == user_id, ActivityEvent.event_type.in_(VISIBLE_EVENTS))
        .order_by(ActivityEvent.occurred_at.desc(), cast(ActivityEvent.github_event_id, BigInteger).desc())
    )


def _older_than(query, occurred_at: datetime, event_id: int):
    return query.filter(
        or_(
            ActivityEvent.occurred_at < occurred_at,
            and_(
                ActivityEvent.occurred_at == occurred_at,
                cast(ActivityEvent.github_event_id, BigInteger) < event_id,
            ),
        )
    )


def load_timeline(db: Session, user_id: int, cursor: str | None = None, limit: int = 40) -> dict:
    """Return one page of timeline items, newest first, plus a cursor for the next.

    A page is `limit` raw events, extended backwards until its oldest item is
    complete — otherwise a session sitting on the boundary would be cut in two,
    showing half of it on each page.
    """
    query = _visible_events(db, user_id)
    if cursor:
        query = _older_than(query, *decode_cursor(cursor))

    page = query.limit(limit).all()  # newest first
    if not page:
        return {"items": [], "next_cursor": None}

    has_older = False
    while True:
        oldest = page[-1]
        batch = _older_than(_visible_events(db, user_id), *chronological_key(oldest)).limit(BOUNDARY_LOOKBACK_BATCH).all()
        if not batch:
            break
        for candidate in batch:
            if continues(candidate, page[-1]):
                page.append(candidate)
            else:
                has_older = True
                break
        if has_older or len(batch) < BOUNDARY_LOOKBACK_BATCH:
            break

    groups = collapse(list(reversed(page)))
    items = [item for item in (build_item(group) for group in groups) if item is not None]
    items.reverse()

    return {
        "items": items,
        "next_cursor": encode_cursor(page[-1]) if has_older else None,
    }
