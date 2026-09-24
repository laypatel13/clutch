from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.insights_service import InsightsService

router = APIRouter()


@router.get("/weekly")
async def get_weekly_insight(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI generated weekly insight for the current user."""
    service = InsightsService()
    return await service.generate_weekly_insight(current_user, db)


@router.get("/summary")
async def get_quick_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a one-liner AI summary of recent activity."""
    service = InsightsService()
    summary = await service.generate_quick_summary(current_user, db)
    return {"summary": summary}


@router.get("/patterns")
async def get_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detect coding patterns from historical activity data."""
    service = InsightsService()
    return await service.detect_patterns(current_user, db)
