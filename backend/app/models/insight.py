from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class WeeklyInsight(Base):
    __tablename__ = "weekly_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)

    # AI generated content
    summary = Column(String(1000), nullable=True)
    strengths = Column(JSON, default=list)
    suggestions = Column(JSON, default=list)
    highlight = Column(String(500), nullable=True)
    productivity_score = Column(Integer, nullable=True)  # 1-10

    # Metadata
    ai_provider = Column(String(50), default="groq")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="weekly_insights")
