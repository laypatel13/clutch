import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app.configuration import settings
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


async def get_github_client(current_user: User = Depends(get_current_user)):
    """An authenticated GitHub HTTP client for the request's user.

    Provided as a dependency rather than built inside each route so tests can
    override it with a mock transport and never reach the real API.
    """
    async with httpx.AsyncClient(
        headers={
            "Authorization": f"Bearer {current_user.github_access_token}",
            "Accept": "application/vnd.github+json",
        },
        timeout=20,
    ) as client:
        yield client
