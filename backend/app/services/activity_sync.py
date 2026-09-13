"""Sync a user's GitHub events into `activity_events` and enrich them.

GitHub's Events API is the only source that lists everything a user did — pushes,
PRs, reviews, comments, branches — across every repository in time order. But
its payloads are trimmed: a push carries only `before`/`head` SHAs (no commit
messages, not even a count) and PR and review events carry a number but no
title. So a sync is two steps:

1. Fetch new events and store each one normalized, immediately.
2. Enrich the stored rows that still lack detail, via batched follow-up calls.

A row is marked `enriched_at` only once its detail is resolved — or known to be
permanently unavailable — so a transient failure (rate limit, timeout, 5xx)
leaves it pending and the next sync retries it.
"""

import asyncio
import json
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app.models.activity_event import ActivityEvent
from app.models.pull_request import PullRequest

API_URL = "https://api.github.com"
GRAPHQL_URL = "https://api.github.com/graphql"
WEB_URL = "https://github.com"

# GitHub serves at most 300 events (3 pages of 100) from the last 90 days.
EVENTS_PER_PAGE = 100
MAX_EVENT_PAGES = 3

MAX_COMMITS_PER_PUSH = 20
TITLE_LOOKUP_BATCH = 50
PUSH_LOOKUP_CONCURRENCY = 5

# Events about a pull request whose payload may lack the PR title.
PULL_REQUEST_EVENTS = {"PullRequestEvent", "PullRequestReviewEvent", "PullRequestReviewCommentEvent"}


class GitHubUnavailable(Exception):
    """GitHub couldn't be reached or refused the request; the sync can't proceed."""


class _RetryLater(Exception):
    """A lookup failed for a reason that may clear up (rate limit, timeout, 5xx)."""


# ---------------------------------------------------------------------------
# Normalizing — pure functions, no I/O
# ---------------------------------------------------------------------------

def parse_github_time(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def is_null_sha(sha: str | None) -> bool:
    """A push to a brand-new branch reports `before` as forty zeros."""
    return not sha or set(sha) == {"0"}


def branch_name(ref: str | None) -> str | None:
    """'refs/heads/feat/timeline' -> 'feat/timeline'."""
    if ref and ref.startswith("refs/"):
        return ref.split("/", 2)[-1]
    return ref


def first_line(message: str) -> str:
    return message.split("\n", 1)[0].strip()[:300]


def normalize_event(raw: dict) -> dict:
    """Turn one raw Events API item into ActivityEvent column values.

    Event types not listed here are still stored — with no action and a link to
    the repository — so a new GitHub event type can never break a sync.
    """
    event_type = raw["type"]
    payload = raw.get("payload") or {}
    repo = raw["repo"]["name"]
    repo_url = f"{WEB_URL}/{repo}"

    action = None
    subject_number = None
    ref = None
    title = None
    url = repo_url

    if event_type == "PushEvent":
        ref = branch_name(payload.get("ref"))
        head, before = payload.get("head"), payload.get("before")
        url = (
            f"{repo_url}/commit/{head}"
            if is_null_sha(before)
            else f"{repo_url}/compare/{before}...{head}"
        )

    elif event_type in PULL_REQUEST_EVENTS:
        pull_request = payload.get("pull_request") or {}
        subject_number = payload.get("number") or pull_request.get("number")
        title = pull_request.get("title")  # present in full payloads, absent in trimmed ones
        url = pull_request.get("html_url") or f"{repo_url}/pull/{subject_number}"
        if event_type == "PullRequestEvent":
            action = payload.get("action")
            # Older payloads report a merge as action "closed" + merged: true.
            if action == "closed" and pull_request.get("merged"):
                action = "merged"
        elif event_type == "PullRequestReviewEvent":
            action = "reviewed"
        else:
            action = "commented"
            url = (payload.get("comment") or {}).get("html_url") or url

    elif event_type in ("IssueCommentEvent", "IssuesEvent"):
        issue = payload.get("issue") or {}
        subject_number = issue.get("number")
        title = issue.get("title")
        if event_type == "IssueCommentEvent":
            action = "commented"
            url = (payload.get("comment") or {}).get("html_url") or issue.get("html_url") or url
        else:
            action = payload.get("action")
            url = issue.get("html_url") or f"{repo_url}/issues/{subject_number}"

    elif event_type == "CreateEvent":
        action = "created"
        ref = payload.get("ref")  # null when the repository itself was created
        if ref:
            url = f"{repo_url}/tree/{ref}"

    elif event_type == "DeleteEvent":
        action = "deleted"
        ref = payload.get("ref")  # the branch is gone, so link to the repository

    elif event_type == "WatchEvent":
        action = "starred"

    elif event_type == "ForkEvent":
        action = "forked"
        url = (payload.get("forkee") or {}).get("html_url") or url

    elif event_type == "ReleaseEvent":
        release = payload.get("release") or {}
        action = payload.get("action")
        title = release.get("name") or release.get("tag_name")
        url = release.get("html_url") or f"{repo_url}/releases"

    return {
        "github_event_id": str(raw["id"]),
        "event_type": event_type,
        "action": action,
        "repo": repo,
        "subject_number": subject_number,
        "ref": ref,
        "title": title,
        "url": url,
        "is_private": not raw.get("public", True),
        "occurred_at": parse_github_time(raw["created_at"]),
        "raw_payload": payload,
    }


def needs_title_lookup(row: ActivityEvent) -> bool:
    return row.event_type in PULL_REQUEST_EVENTS and row.title is None and row.subject_number is not None


def needs_commit_lookup(row: ActivityEvent) -> bool:
    return row.event_type == "PushEvent" and row.commits is None


def build_title_query(keys: list[tuple[str, int]]) -> str:
    """One GraphQL request resolving many PR/issue titles, one alias per lookup."""
    parts = []
    for index, (repo, number) in enumerate(keys):
        owner, name = repo.split("/", 1)
        parts.append(
            f"r{index}: repository(owner: {json.dumps(owner)}, name: {json.dumps(name)}) {{"
            f" issueOrPullRequest(number: {int(number)}) {{"
            f" ... on PullRequest {{ title }} ... on Issue {{ title }} }} }}"
        )
    return "query { " + " ".join(parts) + " }"


# ---------------------------------------------------------------------------
# GitHub I/O
# ---------------------------------------------------------------------------

def _raise_if_transient(response: httpx.Response) -> None:
    # 403 and 429 are how GitHub reports rate limiting.
    if response.status_code in (403, 429) or response.status_code >= 500:
        raise _RetryLater(f"GitHub returned {response.status_code}")


async def fetch_new_events(client: httpx.AsyncClient, username: str, known_ids: set[str]) -> list[dict]:
    """Fetch events newer than anything already stored, newest first.

    Events arrive newest first, so the first page that contains a known ID is
    the last page worth reading — everything past it was stored by an earlier sync.
    """
    new_events: list[dict] = []
    for page in range(1, MAX_EVENT_PAGES + 1):
        try:
            response = await client.get(
                f"{API_URL}/users/{username}/events",
                params={"per_page": EVENTS_PER_PAGE, "page": page},
            )
        except httpx.HTTPError as error:
            if page == 1:
                raise GitHubUnavailable(str(error)) from error
            break

        if response.status_code != 200:
            if page == 1:
                raise GitHubUnavailable(f"GitHub returned {response.status_code}")
            break  # GitHub answers 422 past its 300-event window

        batch = response.json()
        reached_known = False
        for raw in batch:
            if str(raw["id"]) in known_ids:
                reached_known = True
            else:
                new_events.append(raw)

        if reached_known or len(batch) < EVENTS_PER_PAGE:
            break
    return new_events


async def fetch_push_commits(client: httpx.AsyncClient, repo: str, before: str | None, head: str) -> list[dict] | None:
    """Resolve the commits a push introduced.

    Returns None when the commits are permanently unavailable (deleted branch,
    force push to an unreachable SHA, revoked access) and raises _RetryLater
    when the failure might be temporary.
    """
    try:
        if not is_null_sha(before):
            response = await client.get(f"{API_URL}/repos/{repo}/compare/{before}...{head}")
            _raise_if_transient(response)
            if response.status_code == 200:
                commits = response.json().get("commits", [])[-MAX_COMMITS_PER_PUSH:]
                return [{"sha": c["sha"], "message": first_line(c["commit"]["message"])} for c in commits]

        # A brand-new branch has nothing to compare against, and a failed compare
        # (e.g. after a force push) can still resolve the head commit on its own.
        response = await client.get(f"{API_URL}/repos/{repo}/commits/{head}")
        _raise_if_transient(response)
        if response.status_code == 200:
            commit = response.json()
            return [{"sha": commit["sha"], "message": first_line(commit["commit"]["message"])}]
        return None
    except httpx.HTTPError as error:
        raise _RetryLater(str(error)) from error


async def fetch_titles(client: httpx.AsyncClient, keys: list[tuple[str, int]]) -> dict[tuple[str, int], str | None]:
    """Resolve PR/issue titles in batches. A key missing from the result is still pending.

    A key mapped to None was looked up successfully but has no title to show —
    typically a repository the token can no longer see.
    """
    resolved: dict[tuple[str, int], str | None] = {}
    for start in range(0, len(keys), TITLE_LOOKUP_BATCH):
        batch = keys[start:start + TITLE_LOOKUP_BATCH]
        try:
            response = await client.post(GRAPHQL_URL, json={"query": build_title_query(batch)})
        except httpx.HTTPError:
            continue
        if response.status_code != 200:
            continue
        data = response.json().get("data") or {}
        for index, key in enumerate(batch):
            node = (data.get(f"r{index}") or {}).get("issueOrPullRequest")
            resolved[key] = node.get("title") if node else None
    return resolved


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def _store_new_events(db: Session, user, raw_events: list[dict]) -> int:
    for raw in raw_events:
        db.add(ActivityEvent(user_id=user.id, **normalize_event(raw)))
    db.commit()
    return len(raw_events)


async def _enrich_pending(db: Session, user, client: httpx.AsyncClient) -> int:
    pending = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == user.id, ActivityEvent.enriched_at.is_(None))
        .all()
    )
    now = datetime.now(timezone.utc)
    enriched = 0

    # Nothing to look up: the payload already carried everything worth showing.
    for row in pending:
        if not needs_title_lookup(row) and not needs_commit_lookup(row):
            row.enriched_at = now
            enriched += 1

    # Titles: reuse the pull_requests table first — the user's own PRs are
    # already synced with titles — then batch whatever is left into GraphQL.
    title_rows = [row for row in pending if needs_title_lookup(row)]
    if title_rows:
        wanted = {(row.repo, row.subject_number) for row in title_rows}
        known = {
            (pr.repo, pr.pr_number): pr.title
            for pr in db.query(PullRequest).filter(
                PullRequest.user_id == user.id,
                PullRequest.pr_number.in_([number for _, number in wanted]),
            )
            if (pr.repo, pr.pr_number) in wanted
        }
        known.update(await fetch_titles(client, sorted(wanted - known.keys())))
        for row in title_rows:
            key = (row.repo, row.subject_number)
            if key in known:
                row.title = known[key]
                row.enriched_at = now
                enriched += 1

    # Commits: one compare per push, a few at a time.
    semaphore = asyncio.Semaphore(PUSH_LOOKUP_CONCURRENCY)

    async def enrich_push(row: ActivityEvent) -> bool:
        async with semaphore:
            payload = row.raw_payload or {}
            try:
                commits = await fetch_push_commits(client, row.repo, payload.get("before"), payload.get("head"))
            except _RetryLater:
                return False
            # None here means permanently unavailable; setting enriched_at is
            # what stops it being fetched again, and the timeline falls back
            # to "Pushed to {branch}".
            row.commits = commits
            row.enriched_at = now
            return True

    push_rows = [row for row in pending if needs_commit_lookup(row)]
    results = await asyncio.gather(*(enrich_push(row) for row in push_rows))
    enriched += sum(results)

    db.commit()
    return enriched


async def sync_activity_events(user, db: Session, client: httpx.AsyncClient) -> dict:
    # Only recent IDs matter: fetching stops at the first already-stored event,
    # and GitHub never serves more than 300.
    known_ids = {
        event_id
        for (event_id,) in db.query(ActivityEvent.github_event_id)
        .filter(ActivityEvent.user_id == user.id)
        .order_by(ActivityEvent.occurred_at.desc())
        .limit(MAX_EVENT_PAGES * EVENTS_PER_PAGE)
    }
    raw_events = await fetch_new_events(client, user.username, known_ids)
    new_events = _store_new_events(db, user, raw_events)
    enriched = await _enrich_pending(db, user, client)
    return {"new_events": new_events, "enriched": enriched}
