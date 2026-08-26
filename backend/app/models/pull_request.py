from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class PullRequest(Base):
    """One row per GitHub pull request the user has authored.

    Populated by GitHubService.sync_pull_requests_to_db(). Re-syncing upserts
    existing rows (matched on user_id + repo + pr_number) rather than
    duplicating them, so this table stays cheap to keep fresh.
    """

    __tablename__ = "pull_requests"
    __table_args__ = (
        UniqueConstraint("user_id", "repo", "pr_number", name="uq_pull_request_user_repo_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    repo = Column(String(300), nullable=False, index=True)  # "owner/name"
    pr_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    url = Column(String(500), nullable=True)

    # OPEN / MERGED / CLOSED (mirrors GitHub's PullRequestState enum)
    state = Column(String(20), nullable=False, index=True)
    is_draft = Column(Boolean, default=False)
    is_own_repo = Column(Boolean, default=False, index=True)

    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    changed_files = Column(Integer, default=0)
    review_count = Column(Integer, default=0)

    pr_created_at = Column(DateTime(timezone=True), nullable=False)
    pr_merged_at = Column(DateTime(timezone=True), nullable=True)
    pr_closed_at = Column(DateTime(timezone=True), nullable=True)

    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="pull_requests")
