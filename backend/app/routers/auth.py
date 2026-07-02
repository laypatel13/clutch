from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
import jwt
import secrets
from datetime import datetime, timedelta

from app.database import get_db
from app.configuration import settings
from app.models.user import User

router = APIRouter()

OAUTH_STATE_COOKIE = "oauth_state"


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


CLI_CALLBACK_PORT = 9876


@router.get("/github")
def github_login(cli: bool = False, local_nonce: str | None = None):
    """Redirect user to GitHub OAuth page.

    Pass ?cli=true when initiating login from the CLI so the callback
    redirects to the local CLI listener instead of the frontend. The CLI
    also passes its own local_nonce, round-tripped back to it via `state`
    so the local callback listener can reject forged requests from other
    local processes racing to deliver a token to it first.
    """
    purpose = "cli" if cli else "web"
    nonce = secrets.token_urlsafe(32)
    state = f"{purpose}:{nonce}:{local_nonce}" if (purpose == "cli" and local_nonce) else f"{purpose}:{nonce}"
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=read:user,user:email,repo"
        f"&state={state}"
    )
    response = RedirectResponse(url=github_auth_url)
    response.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=nonce,
        max_age=600,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
    )
    return response


@router.get("/github/callback")
async def github_callback(code: str, request: Request, state: str = "web", db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback and return JWT.

    If state == 'cli', redirects to the local CLI callback listener.
    Otherwise redirects to the frontend.
    """

    # Validate the state nonce against the cookie set in github_login() to
    # prevent login CSRF: without this, an attacker can feed their own
    # authorization code to a victim's browser and log the victim into the
    # attacker's account.
    parts = state.split(":", 2)
    purpose = parts[0]
    nonce = parts[1] if len(parts) > 1 else ""
    local_nonce = parts[2] if len(parts) > 2 else None
    cookie_nonce = request.cookies.get(OAUTH_STATE_COOKIE)
    if not nonce or not cookie_nonce or not secrets.compare_digest(nonce, cookie_nonce):
        raise HTTPException(status_code=400, detail="Invalid or missing OAuth state")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to get GitHub access token")

    # Fetch GitHub user profile
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        github_user = user_response.json()

    # Upsert user in database
    user = db.query(User).filter(User.github_id == github_user["id"]).first()
    if not user:
        user = User(
            github_id=github_user["id"],
            username=github_user["login"],
            name=github_user.get("name"),
            email=github_user.get("email"),
            avatar_url=github_user.get("avatar_url"),
            bio=github_user.get("bio"),
            location=github_user.get("location"),
            public_repos=github_user.get("public_repos", 0),
            followers=github_user.get("followers", 0),
            following=github_user.get("following", 0),
            github_access_token=access_token,
        )
        db.add(user)
    else:
        user.github_access_token = access_token
        user.name = github_user.get("name")
        user.avatar_url = github_user.get("avatar_url")
        user.public_repos = github_user.get("public_repos", 0)
        user.followers = github_user.get("followers", 0)

    db.commit()
    db.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})

    # CLI login: redirect to local listener instead of frontend
    if purpose == "cli":
        callback_url = f"http://localhost:{CLI_CALLBACK_PORT}/callback?token={jwt_token}"
        if local_nonce:
            callback_url += f"&local_nonce={local_nonce}"
        response = RedirectResponse(url=callback_url)
    else:
        response = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}"
        )

    response.delete_cookie(OAUTH_STATE_COOKIE)
    return response