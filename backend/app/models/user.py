from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=True)
    email = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    public_repos = Column(Integer, default=0)
    followers = Column(Integer, default=0)
    following = Column(Integer, default=0)

    # OAuth tokens
    github_access_token = Column(String(500), nullable=True)

    # App fields
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    activities = relationship("DailyActivity", back_populates="user")
    weekly_insights = relationship("WeeklyInsight", back_populates="user")
    pull_requests = relationship("PullRequest", back_populates="user")