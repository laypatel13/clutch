"""What every service that talks to GitHub shares: its URLs, its failure, and its timestamps."""

from datetime import UTC, datetime

API_URL = "https://api.github.com"
GRAPHQL_URL = "https://api.github.com/graphql"
WEB_URL = "https://github.com"


class GitHubUnavailable(Exception):
    """GitHub couldn't be reached or refused the request; the sync can't proceed."""


def parse_github_time(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
