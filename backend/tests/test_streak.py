"""Tests for the contribution streak shown on Today."""

import asyncio
from datetime import date, timedelta

import pytest

from app.services.github_service import GitHubService

TODAY = date(2026, 9, 16)


def streak(*days_ago: int) -> dict:
    """Streak for a user active on each of the given days before TODAY."""
    service = GitHubService("token")

    async def fake_activity(username, days=30):
        return {"daily_activity": [
            {"date": str(TODAY - timedelta(days=n)), "commits": 1} for n in days_ago
        ]}

    service.get_activity = fake_activity
    return asyncio.run(service.get_streak("lay", today=TODAY))


def test_a_streak_through_yesterday_is_still_live_before_you_commit_today():
    result = streak(1, 2, 3)
    assert result["current_streak"] == 3
    assert result["active_today"] is False


def test_committing_today_extends_the_streak():
    result = streak(0, 1, 2, 3)
    assert result["current_streak"] == 4
    assert result["active_today"] is True


@pytest.mark.parametrize("days_ago", [(), (2, 3, 4), (0,)])
def test_a_missed_yesterday_ends_the_streak(days_ago):
    expected = 1 if days_ago == (0,) else 0
    assert streak(*days_ago)["current_streak"] == expected


def test_longest_streak_counts_the_best_run_in_the_year():
    result = streak(1, 2, *range(10, 28))
    assert result["longest_streak"] == 18
    assert result["current_streak"] == 2
