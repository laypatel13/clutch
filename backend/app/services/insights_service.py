from datetime import UTC, date, datetime, timedelta

import httpx
from sqlalchemy.orm import Session

from app.configuration import settings
from app.models.activity import DailyActivity
from app.models.user import User


class InsightsService:
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    MODEL = "llama-3.1-8b-instant"

    async def _call_groq(self, prompt: str) -> str:
        """Call Groq API and return the response text."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.GROQ_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=30,
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def generate_weekly_insight(self, user: User, db: Session) -> dict:
        """Generate AI weekly insight for a user."""
        week_start = (datetime.now(UTC) - timedelta(days=7)).date()

        activities = (
            db.query(DailyActivity)
            .filter(
                DailyActivity.user_id == user.id,
                DailyActivity.date >= week_start,
            )
            .all()
        )

        if not activities:
            return {"message": "No activity data yet. Run /github/sync first."}

        stats = {
            "total_commits": sum(a.commits for a in activities),
            "total_prs": sum(a.prs_opened for a in activities),
            "total_issues": sum(a.issues_opened for a in activities),
            "active_days": len([a for a in activities if a.commits > 0]),
            "best_day": max(activities, key=lambda a: a.commits).date.strftime("%A"),
        }

        prompt = f"""
You are a developer productivity coach analyzing a developer's GitHub activity.

Developer: {user.username}
Past 7 days:
- Total commits: {stats["total_commits"]}
- Pull requests opened: {stats["total_prs"]}
- Issues opened: {stats["total_issues"]}
- Active days: {stats["active_days"]} out of 7
- Most productive day: {stats["best_day"]}

Write a short, honest, and encouraging weekly summary in 3-4 sentences.
Be specific about patterns you notice. End with one actionable suggestion.
Keep it casual and human, not corporate.
"""
        summary = await self._call_groq(prompt)

        return {
            "week_start": str(week_start),
            "stats": stats,
            "ai_summary": summary,
            "generated_by": "groq/llama-3.1-8b-instant",
        }

    async def detect_patterns(self, user, db) -> dict:
        """Detect coding patterns from GitHub activity."""
        from app.models.activity import DailyActivity
        from app.services.github_service import GitHubService

        # Try DB first
        activities = db.query(DailyActivity).filter(DailyActivity.user_id == user.id).all()

        # If not enough DB data, fetch live from GitHub
        if len(activities) < 5:
            service = GitHubService(user.github_access_token)
            live = await service.get_activity(user.username, days=90)
            daily_data = live["daily_activity"]
        else:
            daily_data = [
                {
                    "date": str(a.date),
                    "commits": a.commits,
                    "repos": a.repos_contributed or [],
                }
                for a in activities
            ]

        if not daily_data:
            return {"message": "Not enough data yet. Sync your GitHub first."}

        # Day of week analysis
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_commits = {i: 0 for i in range(7)}

        for day in daily_data:
            if day["commits"] > 0:
                try:
                    date_obj = date.fromisoformat(day["date"])
                    day_commits[date_obj.weekday()] += day["commits"]
                except Exception:
                    continue

        best_day_index = max(day_commits, key=day_commits.get)
        worst_day_index = min(day_commits, key=day_commits.get)

        active_days = len([d for d in daily_data if d["commits"] > 0])
        consistency_score = round((active_days / max(len(daily_data), 1)) * 100, 1)
        avg_daily_commits = round(
            sum(d["commits"] for d in daily_data) / max(len(daily_data), 1), 2
        )

        # Top repos
        all_repos = []
        for day in daily_data:
            if day.get("repos"):
                all_repos.extend(day["repos"])

        repo_counts = {}
        for repo in all_repos:
            repo_counts[repo] = repo_counts.get(repo, 0) + 1

        top_repos = sorted(repo_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "best_day": day_names[best_day_index],
            "worst_day": day_names[worst_day_index],
            "day_distribution": {day_names[i]: day_commits[i] for i in range(7)},
            "consistency_score": consistency_score,
            "avg_daily_commits": avg_daily_commits,
            "top_repos": [{"repo": r, "days_active": c} for r, c in top_repos],
            "total_active_days": active_days,
        }
