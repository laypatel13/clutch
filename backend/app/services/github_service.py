import httpx
from datetime import datetime, timedelta


class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }

    async def get_activity(self, username: str, days: int = 30) -> dict:
        """Fetch user's GitHub contributions using GraphQL API."""
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

        query = """
        query($username: String!, $from: DateTime!) {
        user(login: $username) {
            contributionsCollection(from: $from) {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            contributionCalendar {
                weeks {
                contributionDays {
                    date
                    contributionCount
                }
                }
            }
            }
        }
        }
        """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.github.com/graphql",
                headers=self.headers,
                json={"query": query, "variables": {"username": username, "from": since}},
            )
            data = response.json()

        collection = data["data"]["user"]["contributionsCollection"]
        calendar = collection["contributionCalendar"]

        daily = []
        for week in calendar["weeks"]:
            for day in week["contributionDays"]:
                if day["contributionCount"] > 0:
                    daily.append({
                        "date": day["date"],
                        "commits": day["contributionCount"],
                        "prs": 0,
                        "issues": 0,
                        "reviews": 0,
                        "repos": [],
                    })

        return {
            "username": username,
            "days": days,
            "daily_activity": daily,
            "total_commits": collection["totalCommitContributions"],
            "total_prs": collection["totalPullRequestContributions"],
            "total_issues": collection["totalIssueContributions"],
            "active_days": len(daily),
        }

    async def get_heatmap(self, username: str) -> dict:
        """Fetch a full 12-month contribution calendar for the heatmap view.

        Unlike get_activity(), this keeps every day including zero-activity
        days, since a GitHub-style heatmap needs to render empty squares too.
        """
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ")

        query = """
        query($username: String!, $from: DateTime!) {
        user(login: $username) {
            contributionsCollection(from: $from) {
            contributionCalendar {
                totalContributions
                weeks {
                contributionDays {
                    date
                    contributionCount
                }
                }
            }
            }
        }
        }
        """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.github.com/graphql",
                headers=self.headers,
                json={"query": query, "variables": {"username": username, "from": since}},
            )
            data = response.json()

        collection = data["data"]["user"]["contributionsCollection"]
        calendar = collection["contributionCalendar"]

        days = []
        max_count = 0
        for week in calendar["weeks"]:
            for day in week["contributionDays"]:
                count = day["contributionCount"]
                max_count = max(max_count, count)
                days.append({"date": day["date"], "count": count})

        return {
            "username": username,
            "total_contributions": calendar["totalContributions"],
            "max_count": max_count,
            "days": days,
        }

    async def get_streak(self, username: str) -> dict:
        """Calculate current and longest commit streak."""
        activity = await self.get_activity(username, days=365)
        active_dates = set(
            d["date"] for d in activity["daily_activity"] if d["commits"] > 0
        )

        # Calculate current streak
        current_streak = 0
        check_date = datetime.utcnow().date()
        while str(check_date) in active_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # Calculate longest streak
        longest_streak = 0
        temp_streak = 0
        for i in range(365):
            date = str((datetime.utcnow() - timedelta(days=i)).date())
            if date in active_dates:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 0

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_active_days": len(active_dates),
        }

    async def get_language_breakdown(self, username: str) -> dict:
        """Get language usage across user's repositories."""
        async with httpx.AsyncClient() as client:
            repos_response = await client.get(
                f"{self.BASE_URL}/user/repos?per_page=50&sort=updated",
                headers=self.headers,
            )
            repos = repos_response.json()

        languages = {}
        async with httpx.AsyncClient() as client:
            for repo in repos[:20]:  # Limit to top 20 repos
                lang_response = await client.get(
                    f"{self.BASE_URL}/repos/{repo['full_name']}/languages",
                    headers=self.headers,
                )
                repo_langs = lang_response.json()
                for lang, bytes_count in repo_langs.items():
                    languages[lang] = languages.get(lang, 0) + bytes_count

        total = sum(languages.values()) or 1
        return {
            lang: {
                "bytes": bytes_count,
                "percentage": round((bytes_count / total) * 100, 2),
            }
            for lang, bytes_count in sorted(
                languages.items(), key=lambda x: x[1], reverse=True
            )
        }

    async def get_pull_requests(self, username: str, max_results: int = 200) -> list[dict]:
        """Fetch the user's authored pull requests via GitHub's search API.

        Paginates in pages of 100 (GraphQL's max page size for search) up to
        max_results total. This is a per-user OAuth call, so it draws from
        that user's own ~5000 point/hour GraphQL budget, not a shared pool.
        """
        query = """
        query($searchQuery: String!, $cursor: String) {
          search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              ... on PullRequest {
                number
                title
                url
                state
                isDraft
                additions
                deletions
                changedFiles
                createdAt
                mergedAt
                closedAt
                reviews { totalCount }
                repository {
                  nameWithOwner
                  owner { login }
                }
              }
            }
          }
        }
        """
        search_query = f"author:{username} type:pr"
        pull_requests: list[dict] = []
        cursor = None

        async with httpx.AsyncClient() as client:
            while len(pull_requests) < max_results:
                response = await client.post(
                    "https://api.github.com/graphql",
                    headers=self.headers,
                    json={"query": query, "variables": {"searchQuery": search_query, "cursor": cursor}},
                )
                data = response.json()
                search = data.get("data", {}).get("search")
                if not search:
                    break

                for node in search["nodes"]:
                    if not node:  # deleted/inaccessible PRs come back null
                        continue
                    repo = node["repository"]
                    pull_requests.append({
                        "repo": repo["nameWithOwner"],
                        "is_own_repo": repo["owner"]["login"].lower() == username.lower(),
                        "pr_number": node["number"],
                        "title": node["title"],
                        "url": node["url"],
                        "state": node["state"],
                        "is_draft": node["isDraft"],
                        "additions": node["additions"],
                        "deletions": node["deletions"],
                        "changed_files": node["changedFiles"],
                        "review_count": node["reviews"]["totalCount"],
                        "created_at": node["createdAt"],
                        "merged_at": node["mergedAt"],
                        "closed_at": node["closedAt"],
                    })

                page_info = search["pageInfo"]
                if not page_info["hasNextPage"] or len(pull_requests) >= max_results:
                    break
                cursor = page_info["endCursor"]

        return pull_requests[:max_results]

    async def sync_pull_requests_to_db(self, user, db) -> int:
        """Fetch the user's PRs and upsert them into the pull_requests table."""
        from app.models.pull_request import PullRequest

        prs = await self.get_pull_requests(user.username)

        synced = 0
        for pr in prs:
            existing = (
                db.query(PullRequest)
                .filter(
                    PullRequest.user_id == user.id,
                    PullRequest.repo == pr["repo"],
                    PullRequest.pr_number == pr["pr_number"],
                )
                .first()
            )
            fields = {
                "title": pr["title"],
                "url": pr["url"],
                "state": pr["state"],
                "is_draft": pr["is_draft"],
                "is_own_repo": pr["is_own_repo"],
                "additions": pr["additions"],
                "deletions": pr["deletions"],
                "changed_files": pr["changed_files"],
                "review_count": pr["review_count"],
                "pr_created_at": datetime.strptime(pr["created_at"], "%Y-%m-%dT%H:%M:%SZ"),
                "pr_merged_at": datetime.strptime(pr["merged_at"], "%Y-%m-%dT%H:%M:%SZ") if pr["merged_at"] else None,
                "pr_closed_at": datetime.strptime(pr["closed_at"], "%Y-%m-%dT%H:%M:%SZ") if pr["closed_at"] else None,
            }
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
            else:
                db.add(PullRequest(user_id=user.id, repo=pr["repo"], pr_number=pr["pr_number"], **fields))
            synced += 1

        db.commit()
        return synced

    async def sync_to_db(self, user, db) -> int:
        """Sync GitHub activity to the database."""
        from app.models.activity import DailyActivity

        activity = await self.get_activity(user.username, days=30)

        synced = 0
        for day_data in activity["daily_activity"]:
            day_date = datetime.strptime(day_data["date"], "%Y-%m-%d").date()
            existing = (
                db.query(DailyActivity)
                .filter(
                    DailyActivity.user_id == user.id,
                    DailyActivity.date == day_date,
                )
                .first()
            )
            if existing:
                existing.commits = day_data["commits"]
                existing.prs_opened = day_data["prs"]
                existing.issues_opened = day_data["issues"]
                existing.reviews = day_data["reviews"]
                existing.repos_contributed = day_data["repos"]
            else:
                new_activity = DailyActivity(
                    user_id=user.id,
                    date=day_date,
                    commits=day_data["commits"],
                    prs_opened=day_data["prs"],
                    issues_opened=day_data["issues"],
                    reviews=day_data["reviews"],
                    repos_contributed=day_data["repos"],
                )
                db.add(new_activity)
            synced += 1

        user.last_synced_at = datetime.utcnow()
        db.commit()
        return synced