from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DailyActivity(Base):
    __tablename__ = "daily_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    # GitHub stats
    commits = Column(Integer, default=0)
    prs_opened = Column(Integer, default=0)
    prs_merged = Column(Integer, default=0)
    issues_opened = Column(Integer, default=0)
    issues_closed = Column(Integer, default=0)
    reviews = Column(Integer, default=0)
    repos_contributed = Column(JSON, default=list)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="activities")
