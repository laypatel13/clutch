import httpx
import typer
from clutch_cli.config import get_token, API_BASE_URL


def get_client() -> httpx.Client:
    """Get authenticated HTTP client."""
    token = get_token()
    if not token:
        typer.echo("❌ You are not logged in. Run: clutch auth login")
        raise typer.Exit(1)
    return httpx.Client(
        base_url=API_BASE_URL,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
