"""The activity timeline: syncing GitHub events and reading them back as a feed."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_github_client
from app.models.user import User
from app.services.activity_sync import sync_activity_events
from app.services.github import GitHubUnavailable
from app.services.timeline import InvalidCursor, load_timeline

router = APIRouter()


@router.post("/events/sync")
async def sync_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    client: httpx.AsyncClient = Depends(get_github_client),
):
    """Fetch the user's new GitHub events, store them, and enrich pending rows."""
    try:
        result = await sync_activity_events(current_user, db, client)
    except GitHubUnavailable as error:
        raise HTTPException(status_code=502, detail=f"Couldn't reach GitHub: {error}") from error
    return {"message": "Activity sync complete", **result}


@router.get("/timeline")
def get_timeline(
    cursor: str | None = None,
    limit: int = Query(40, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """One page of the user's activity timeline, newest first, read from the database.

    Pass the previous response's `next_cursor` to load older activity. Timestamps
    are UTC; grouping into days is left to the client, which knows the viewer's
    timezone.
    """
    try:
        return load_timeline(db, current_user.id, cursor=cursor, limit=limit)
    except InvalidCursor:
        raise HTTPException(status_code=400, detail="Invalid timeline cursor") from None
