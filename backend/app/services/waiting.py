"""What's waiting on the user: the open pull-request loops they still need to close.

The timeline answers "what did I do?". This answers "what's unfinished?".

It asks GitHub live on every request instead of storing PR state. A list of
things waiting on you is only useful while it's current — one that still shows
a review you finished an hour ago is worse than no list at all.

Every open PR lands in at most one section, checked in order of urgency:

    review_requested    someone asked you, directly, to review their PR
    ready_to_merge      your PR is approved and you're able to merge it
    changes_requested   a reviewer asked for changes you haven't pushed since
    gone_quiet          your PR has had no activity for QUIET_AFTER…
    probably_abandoned  …or for ABANDONED_AFTER, which the page shows collapsed
    awaiting_maintainer your PR is approved, but merging is up to someone else

The last is informational rather than a loop you close yourself, so it's
checked before the quiet rules (an approval is more useful to know about than
the silence that follows it) but isn't counted as waiting on you.
"""

from datetime import datetime, timedelta, timezone

import httpx

from app.services.activity_sync import GRAPHQL_URL, GitHubUnavailable

QUIET_AFTER = timedelta(days=7)
ABANDONED_AFTER = timedelta(days=60)
SEARCH_LIMIT = 50
SUMMARY_TITLE_LENGTH = 72

# Permissions that can merge a pull request. Without one of these — typically
# an external contribution — an approved PR is waiting on a maintainer, not you.
MERGE_PERMISSIONS = {"ADMIN", "MAINTAIN", "WRITE"}

SECTIONS = (
    "review_requested", "ready_to_merge", "changes_requested",
    "gone_quiet", "probably_abandoned", "awaiting_maintainer",
)

QUERY = """
query($authored: String!, $requested: String!, $limit: Int!) {
  authored: search(query: $authored, type: ISSUE, first: $limit) {
    nodes {
      ... on PullRequest {
        number
        title
        url
        isDraft
        updatedAt
        reviewDecision
        repository { nameWithOwner viewerPermission }
        commits(last: 1) { nodes { commit { committedDate } } }
        latestOpinionatedReviews(first: 20) { nodes { state submittedAt author { login } } }
      }
    }
  }
  requested: search(query: $requested, type: ISSUE, first: $limit) {
    nodes {
      ... on PullRequest {
        number
        title
        url
        isDraft
        updatedAt
        author { login }
        repository { nameWithOwner }
        timelineItems(itemTypes: [REVIEW_REQUESTED_EVENT], last: 10) {
          nodes {
            ... on ReviewRequestedEvent {
              createdAt
              requestedReviewer { ... on User { login } }
            }
          }
        }
      }
    }
  }
}
"""


def search_queries(username: str) -> dict:
    return {
        "authored": f"is:pr is:open author:{username} archived:false",
        # user-review-requested matches requests made to you personally. The
        # broader review-requested also includes every team you belong to,
        # which floods the list in large organisations.
        "requested": f"is:pr is:open user-review-requested:{username} archived:false",
        "limit": SEARCH_LIMIT,
    }


# ---------------------------------------------------------------------------
# Classifying — pure functions over GraphQL nodes
# ---------------------------------------------------------------------------

def _parse(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def _truncate(text: str) -> str:
    return text if len(text) <= SUMMARY_TITLE_LENGTH else text[: SUMMARY_TITLE_LENGTH - 1].rstrip() + "…"


def _is_pull_request(node) -> bool:
    # Search can return null nodes (e.g. repositories behind SSO the token can't
    # see) and empty objects for results the PullRequest fragment didn't match.
    return bool(node) and "number" in node


def _reviews(pr: dict) -> list[dict]:
    nodes = (pr.get("latestOpinionatedReviews") or {}).get("nodes") or []
    return [
        {"state": r.get("state"), "at": _parse(r.get("submittedAt")), "by": (r.get("author") or {}).get("login")}
        for r in nodes
        if r
    ]


def _latest_review(reviews: list[dict], state: str) -> dict | None:
    matching = [r for r in reviews if r["state"] == state and r["at"]]
    return max(matching, key=lambda r: r["at"]) if matching else None


def _review_decision(pr: dict, reviews: list[dict]) -> str | None:
    # reviewDecision is only populated in repositories whose branch protection
    # requires reviews. Elsewhere it's null, so derive it from each reviewer's
    # latest opinion instead.
    if pr.get("reviewDecision"):
        return pr["reviewDecision"]
    states = {r["state"] for r in reviews}
    if "CHANGES_REQUESTED" in states:
        return "CHANGES_REQUESTED"
    if "APPROVED" in states:
        return "APPROVED"
    return None


def _last_commit_at(pr: dict) -> datetime | None:
    nodes = (pr.get("commits") or {}).get("nodes") or []
    return _parse(((nodes[-1] or {}).get("commit") or {}).get("committedDate")) if nodes else None


def _latest_request_for(pr: dict, username: str) -> datetime | None:
    """When you were last asked to review. Someone else being asked doesn't count."""
    nodes = (pr.get("timelineItems") or {}).get("nodes") or []
    times = [
        _parse(node.get("createdAt"))
        for node in nodes
        if node and ((node.get("requestedReviewer") or {}).get("login") or "").lower() == username.lower()
    ]
    times = [t for t in times if t]
    return max(times) if times else None


def _item(pr: dict, since: datetime, verb: str, detail: str | None) -> dict:
    repo = pr["repository"]["nameWithOwner"]
    number = pr["number"]
    title = pr.get("title")
    summary = f"{verb} PR #{number}" + (f" — {_truncate(title)}" if title else "")
    return {
        "id": f"{repo}#{number}",
        "repo": repo,
        "number": number,
        "title": title,
        "url": pr.get("url") or f"https://github.com/{repo}/pull/{number}",
        # An imperative sentence — the next thing to do — ready to display as-is.
        "summary": summary,
        "detail": detail,
        "since": since.isoformat(),
    }


def classify(authored: list, requested: list, username: str, now: datetime) -> dict[str, list[dict]]:
    sections: dict[str, list[dict]] = {name: [] for name in SECTIONS}

    for pr in requested:
        if not _is_pull_request(pr) or pr.get("isDraft"):
            continue
        # Falls back to the PR's last activity when the request came through a
        # team rather than to you by name, so there's no event naming you.
        since = _latest_request_for(pr, username) or _parse(pr["updatedAt"])
        author = (pr.get("author") or {}).get("login")
        sections["review_requested"].append(
            _item(pr, since, "Review", f"opened by {author}" if author else None)
        )

    for pr in authored:
        if not _is_pull_request(pr) or pr.get("isDraft"):
            continue  # a draft is parked on purpose

        reviews = _reviews(pr)
        decision = _review_decision(pr, reviews)
        updated_at = _parse(pr["updatedAt"])

        permission = (pr.get("repository") or {}).get("viewerPermission")
        if decision == "APPROVED":
            approval = _latest_review(reviews, "APPROVED")
            since = approval["at"] if approval else updated_at
            approved_by = f"approved by {approval['by']}" if approval and approval["by"] else None
            if permission in MERGE_PERMISSIONS:
                sections["ready_to_merge"].append(_item(pr, since, "Merge", approved_by))
            else:
                # Typically an external contribution: approved, but only the
                # repository's maintainers can merge it.
                sections["awaiting_maintainer"].append(_item(pr, since, "Approved:", approved_by))
            continue

        if decision == "CHANGES_REQUESTED":
            request = _latest_review(reviews, "CHANGES_REQUESTED")
            last_commit = _last_commit_at(pr)
            addressed = request is not None and last_commit is not None and last_commit > request["at"]
            if not addressed:
                sections["changes_requested"].append(_item(
                    pr,
                    request["at"] if request else updated_at,
                    "Address changes on",
                    f"requested by {request['by']}" if request and request["by"] else None,
                ))
                continue
            # Pushed since the request, so the reviewer has the next move. It
            # only resurfaces below if it stalls.

        quiet_for = now - updated_at
        if quiet_for >= ABANDONED_AFTER:
            sections["probably_abandoned"].append(_item(pr, updated_at, "Follow up on", None))
        elif quiet_for >= QUIET_AFTER:
            sections["gone_quiet"].append(_item(pr, updated_at, "Follow up on", None))

    for items in sections.values():
        items.sort(key=lambda item: item["since"])  # oldest waiting first
    return sections


# ---------------------------------------------------------------------------
# GitHub I/O
# ---------------------------------------------------------------------------

async def fetch_waiting(client: httpx.AsyncClient, username: str, now: datetime | None = None) -> dict:
    """One GraphQL request covering both your PRs and review requests to you."""
    try:
        response = await client.post(GRAPHQL_URL, json={"query": QUERY, "variables": search_queries(username)})
    except httpx.HTTPError as error:
        raise GitHubUnavailable(str(error)) from error
    if response.status_code != 200:
        raise GitHubUnavailable(f"GitHub returned {response.status_code}")

    body = response.json()
    data = body.get("data")
    if not data:
        errors = body.get("errors") or [{}]
        raise GitHubUnavailable(errors[0].get("message", "GitHub returned no data"))

    now = now or datetime.now(timezone.utc)
    sections = classify(
        (data.get("authored") or {}).get("nodes") or [],
        (data.get("requested") or {}).get("nodes") or [],
        username,
        now,
    )
    return {"checked_at": now.isoformat(), "sections": sections}
