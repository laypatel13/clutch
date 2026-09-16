from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ActivityEvent(Base):
    """One row per GitHub event the user performed — the raw material of the timeline.

    Populated by app.services.activity_sync. GitHub's event payloads are
    trimmed (pushes carry no commit messages, PR events carry no titles), so
    each row is enriched once after insert; `enriched_at` stays null until that
    succeeds, which is what lets a failed lookup be retried on the next sync.
    """

    __tablename__ = "activity_events"
    __table_args__ = (
        UniqueConstraint("user_id", "github_event_id", name="uq_activity_event_user_github_id"),
        Index("ix_activity_events_user_occurred", "user_id", "occurred_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # GitHub event IDs are strings in the API response.
    github_event_id = Column(String(40), nullable=False)
    event_type = Column(String(50), nullable=False)  # PushEvent, PullRequestEvent, …
    action = Column(String(30), nullable=True)       # opened / merged / closed / created …

    repo = Column(String(300), nullable=False)       # "owner/name"
    subject_number = Column(Integer, nullable=True)  # PR or issue number
    ref = Column(String(300), nullable=True)         # branch or tag name

    title = Column(String(500), nullable=True)       # PR / issue title (enriched)
    commits = Column(JSON, nullable=True)            # [{"sha", "message"}] for pushes (enriched)

    url = Column(String(500), nullable=False)
    is_private = Column(Boolean, default=False)

    occurred_at = Column(DateTime(timezone=True), nullable=False)
    raw_payload = Column(JSON, nullable=False)
    enriched_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="activity_events")
