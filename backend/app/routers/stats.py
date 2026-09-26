"""GitHub stats: activity, streak, heatmap, languages and repositories."""

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.github import API_URL
from app.services.stats import StatsService

router = APIRouter()


@router.get("/activity")
async def get_activity(
    days: int = 30,
    current_user: User = Depends(get_current_user),
):
    """Get user's GitHub activity for the past N days."""
    service = StatsService(current_user.github_access_token)
    return await service.get_activity(current_user.username, days=days)


@router.get("/streak")
async def get_streak(
    current_user: User = Depends(get_current_user),
):
    """Get the user's current and longest commit streak."""
    service = StatsService(current_user.github_access_token)
    return await service.get_streak(current_user.username)


@router.get("/heatmap")
async def get_heatmap(
    current_user: User = Depends(get_current_user),
):
    """Get the user's full 12-month contribution heatmap."""
    service = StatsService(current_user.github_access_token)
    return await service.get_heatmap(current_user.username)


@router.get("/languages")
async def get_languages(
    current_user: User = Depends(get_current_user),
):
    """Get language breakdown across user's repositories."""
    service = StatsService(current_user.github_access_token)
    return await service.get_language_breakdown(current_user.username)


@router.post("/sync")
async def sync_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger a sync of GitHub activity to the database."""
    service = StatsService(current_user.github_access_token)
    synced = await service.sync_to_db(current_user, db)
    return {"message": "Sync complete", "synced_days": synced}


@router.get("/repos")
async def get_repos(
    current_user: User = Depends(get_current_user),
):
    """Get user's repositories sorted by last updated."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_URL}/user/repos?sort=updated&per_page=20",
            headers={"Authorization": f"Bearer {current_user.github_access_token}"},
        )
        return response.json()


@router.post("/pulls/sync")
async def sync_pull_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch the user's PRs from GitHub and upsert them into the database."""
    service = StatsService(current_user.github_access_token)
    synced = await service.sync_pull_requests_to_db(current_user, db)
    return {"message": "PR sync complete", "synced_prs": synced}
