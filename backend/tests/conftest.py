import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — registers every model on Base.metadata
from app.database import Base
from app.models.user import User


@pytest.fixture
def db():
    # One in-memory database per test; StaticPool keeps every session on the
    # same connection so they all see the same tables.
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


@pytest.fixture
def user(db):
    account = User(github_id=1, username="lay", github_access_token="token")
    db.add(account)
    db.commit()
    return account
