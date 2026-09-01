from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.github_service import GitHubService
from app.services.pr_analytics import get_pr_summary, get_review_stats
from app.dependencies import get_current_user
from app.models.user import User
from app.models.pull_request import PullRequest

router = APIRouter()


@router.get("/activity")
async def get_activity(
    days: int = 30,
    current_user: User = Depends(get_current_user),
):
    """Get user's GitHub activity for the past N days."""
    service = GitHubService(current_user.github_access_token)
    return await service.get_activity(current_user.username, days=days)


@router.get("/streak")
async def get_streak(
    current_user: User = Depends(get_current_user),
):
    """Get the user's current and longest commit streak."""
    service = GitHubService(current_user.github_access_token)
    return await service.get_streak(current_user.username)


@router.get("/heatmap")
async def get_heatmap(
    current_user: User = Depends(get_current_user),
):
    """Get the user's full 12-month contribution heatmap."""
    service = GitHubService(current_user.github_access_token)
    return await service.get_heatmap(current_user.username)


@router.get("/languages")
async def get_languages(
    current_user: User = Depends(get_current_user),
):
    """Get language breakdown across user's repositories."""
    service = GitHubService(current_user.github_access_token)
    return await service.get_language_breakdown(current_user.username)


@router.post("/sync")
async def sync_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger a sync of GitHub activity to the database."""
    service = GitHubService(current_user.github_access_token)
    synced = await service.sync_to_db(current_user, db)
    return {"message": "Sync complete", "synced_days": synced}

@router.get("/repos")
async def get_repos(
    current_user: User = Depends(get_current_user),
):
    """Get user's repositories sorted by last updated."""
    import httpx as _httpx
    async with _httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos?sort=updated&per_page=20",
            headers={"Authorization": f"Bearer {current_user.github_access_token}"},
        )
        return response.json()


@router.post("/pulls/sync")
async def sync_pull_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch the user's PRs from GitHub and upsert them into the database."""
    service = GitHubService(current_user.github_access_token)
    synced = await service.sync_pull_requests_to_db(current_user, db)
    return {"message": "PR sync complete", "synced_prs": synced}


@router.get("/pulls")
async def list_pull_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the user's synced pull requests from the database (no live GitHub call)."""
    prs = (
        db.query(PullRequest)
        .filter(PullRequest.user_id == current_user.id)
        .order_by(PullRequest.pr_created_at.desc())
        .all()
    )
    return [
        {
            "repo": p.repo,
            "pr_number": p.pr_number,
            "title": p.title,
            "url": p.url,
            "state": p.state,
            "is_draft": p.is_draft,
            "is_own_repo": p.is_own_repo,
            "additions": p.additions,
            "deletions": p.deletions,
            "changed_files": p.changed_files,
            "review_count": p.review_count,
            "created_at": p.pr_created_at,
            "merged_at": p.pr_merged_at,
            "closed_at": p.pr_closed_at,
        }
        for p in prs
    ]


@router.get("/pulls/summary")
async def pull_requests_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get derived PR-quality metrics: merge rate, time-to-merge, size mix, stale PRs."""
    return get_pr_summary(current_user, db)


@router.get("/pulls/reviews")
async def pull_requests_review_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Review-engagement metrics: reviewed rate, avg reviews, unreviewed merged PRs."""
    prs = db.query(PullRequest).filter(PullRequest.user_id == current_user.id).all()
    return get_review_stats(prs)