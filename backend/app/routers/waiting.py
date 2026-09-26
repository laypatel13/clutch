"""What's waiting on the user, checked live against GitHub."""

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_github_client
from app.models.user import User
from app.services.github import GitHubUnavailable
from app.services.waiting import fetch_waiting

router = APIRouter()


@router.get("/waiting")
async def get_waiting(
    current_user: User = Depends(get_current_user),
    client: httpx.AsyncClient = Depends(get_github_client),
):
    """Open pull-request loops waiting on the user, checked live against GitHub."""
    try:
        return await fetch_waiting(client, current_user.username)
    except GitHubUnavailable as error:
        raise HTTPException(status_code=502, detail=f"Couldn't reach GitHub: {error}") from error
