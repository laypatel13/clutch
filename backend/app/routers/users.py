from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "location": current_user.location,
        "public_repos": current_user.public_repos,
        "followers": current_user.followers,
        "following": current_user.following,
        "is_public": current_user.is_public,
        "created_at": current_user.created_at,
        "last_synced_at": current_user.last_synced_at,
    }


@router.get("/{username}")
def get_user_profile(username: str, db: Session = Depends(get_db)):
    """Get a public user profile by username."""
    user = db.query(User).filter(User.username == username, User.is_public.is_(True)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user.username,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "location": user.location,
        "public_repos": user.public_repos,
        "followers": user.followers,
        "following": user.following,
    }


@router.patch("/me/settings")
def update_settings(
    is_public: bool = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user settings."""
    if is_public is not None:
        current_user.is_public = is_public
    db.commit()
    return {"message": "Settings updated successfully"}
