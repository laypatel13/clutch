import json
import httpx
import typer
from rich.table import Table
from rich import box
from clutch_cli.config import API_BASE_URL, get_token, get_username
from clutch_cli.theme import console, ACCENT, DIM, SUCCESS, ERROR, WARNING, footer, mini_banner


def status(json_output: bool = typer.Option(False, "--json", "-j", help="Output as JSON")):
    """Show login status and API health."""
    username = get_username()
    token = get_token()

    if not username or not token:
        if json_output:
            typer.echo(json.dumps({"logged_in": False, "username": None, "token_valid": False, "api_reachable": None, "api_url": API_BASE_URL}))
        else:
            mini_banner()
            table = Table(box=box.SIMPLE, show_header=False, pad_edge=False)
            table.add_column("Check", style=DIM, width=18)
            table.add_column("Result", style="bold white")
            table.add_row("Auth", f"[{ERROR}]Not logged in[/{ERROR}]")
            table.add_row("Hint", f"[{DIM}]Run: clutch login[/{DIM}]")
            console.print(table)
            footer()
        raise SystemExit()

    # Three distinct states:
    #   1) 200             -> Token Valid, API Reachable
    #   2) non-200 (e.g.401) -> Token Expired (code), API Reachable  (request completed)
    #   3) network error   -> Token Saved, API Unreachable            (request threw)
    token_valid = False
    api_reachable = False
    status_code = None

    try:
        response = httpx.get(
            f"{API_BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
        )
        api_reachable = True
        status_code = response.status_code
        token_valid = response.status_code == 200
    except httpx.RequestError:
        pass

    if json_output:
        typer.echo(json.dumps({
            "logged_in": True,
            "username": username,
            "token_valid": token_valid,
            "api_reachable": api_reachable,
            "status_code": status_code,
            "api_url": API_BASE_URL,
        }))
        return

    mini_banner()
    table = Table(box=box.SIMPLE, show_header=False, pad_edge=False)
    table.add_column("Check", style=DIM, width=18)
    table.add_column("Result", style="bold white")
    table.add_row("User", f"[{ACCENT}]@{username}[/{ACCENT}]")
    if api_reachable:
        if token_valid:
            table.add_row("Token", f"[{SUCCESS}]Valid[/{SUCCESS}]")
            table.add_row("API", f"[{SUCCESS}]Reachable[/{SUCCESS}]  [{DIM}]{API_BASE_URL}[/{DIM}]")
        else:
            table.add_row("Token", f"[{WARNING}]Expired ({status_code})[/{WARNING}]")
            table.add_row("API", f"[{SUCCESS}]Reachable[/{SUCCESS}]  [{DIM}]{API_BASE_URL}[/{DIM}]")
            table.add_row("Hint", f"[{DIM}]Run: clutch login[/{DIM}]")
    else:
        table.add_row("Token", f"[{SUCCESS}]Saved[/{SUCCESS}]")
        table.add_row("API", f"[{ERROR}]Unreachable[/{ERROR}]")
    console.print(table)
    footer()