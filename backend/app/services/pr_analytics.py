from datetime import datetime, timezone, timedelta


def _size_bucket(additions: int, deletions: int) -> str:
    total = additions + deletions
    if total < 50:
        return "small"
    if total < 300:
        return "medium"
    return "large"


def get_pr_summary(user, db) -> dict:
    """Compute derived PR-quality metrics from the synced pull_requests table.

    These are the numbers GitHub's own profile doesn't compute for you:
    merge rate, time-to-merge, size distribution, and stale open PRs.
    Call sync_pull_requests_to_db() first (or ensure it's been run recently) —
    this function only reads what's already stored, it never hits GitHub.
    """
    from app.models.pull_request import PullRequest

    prs = db.query(PullRequest).filter(PullRequest.user_id == user.id).all()

    if not prs:
        return {
            "total_prs": 0,
            "merge_rate": None,
            "avg_time_to_merge_days": None,
            "size_distribution": {"small": 0, "medium": 0, "large": 0},
            "own_repo_count": 0,
            "external_repo_count": 0,
            "stale_prs": [],
        }

    merged = [p for p in prs if p.state == "MERGED"]
    closed_unmerged = [p for p in prs if p.state == "CLOSED"]
    open_prs = [p for p in prs if p.state == "OPEN"]

    decided = len(merged) + len(closed_unmerged)
    merge_rate = round(len(merged) / decided, 3) if decided else None

    merge_days = [
        (p.pr_merged_at - p.pr_created_at).total_seconds() / 86400
        for p in merged
        if p.pr_merged_at and p.pr_created_at
    ]
    avg_time_to_merge_days = round(sum(merge_days) / len(merge_days), 1) if merge_days else None

    size_distribution = {"small": 0, "medium": 0, "large": 0}
    for p in prs:
        size_distribution[_size_bucket(p.additions or 0, p.deletions or 0)] += 1

    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(days=10)
    stale_prs = [
        {
            "repo": p.repo,
            "pr_number": p.pr_number,
            "title": p.title,
            "url": p.url,
            "days_open": round((now - p.pr_created_at.replace(tzinfo=timezone.utc)).total_seconds() / 86400),
        }
        for p in open_prs
        if not p.is_draft and p.pr_created_at.replace(tzinfo=timezone.utc) < stale_cutoff
    ]
    stale_prs.sort(key=lambda x: x["days_open"], reverse=True)

    return {
        "total_prs": len(prs),
        "merge_rate": merge_rate,
        "avg_time_to_merge_days": avg_time_to_merge_days,
        "size_distribution": size_distribution,
        "own_repo_count": sum(1 for p in prs if p.is_own_repo),
        "external_repo_count": sum(1 for p in prs if not p.is_own_repo),
        "stale_prs": stale_prs,
    }
