from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.routers import auth, github, users, insights
from app.configuration import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clutch API",
    description="GitHub tracks your work. Clutch tracks you.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(github.router, prefix="/github", tags=["GitHub"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])


@app.get("/", tags=["System"])
def root():
    return {"message": "Clutch API is live 🚀", "version": "0.1.0"}


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}


@app.get("/ready", tags=["System"])
def ready(db: Session = Depends(get_db)):
    # Lightweight readiness check: ensure DB is connectable through the session layer
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return {"status": "error", "db": "unavailable"}
    return {"status": "ok", "db": "ok"}