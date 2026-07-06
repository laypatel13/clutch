import json
import httpx
import typer
from rich.table import Table
from rich import box
from clutch_cli.config import API_BASE_URL, get_token, get_username
from clutch_cli.theme import console, ACCENT, DIM, SUCCESS, ERROR, WARNING, header, footer


def status(json_output: bool = typer.Option(False, "--json", "-j", help="Output as JSON")):
    """Show login status and API health."""
    username = get_username()
    token = get_token()

    if not username or not token:
        if json_output:
            typer.echo(json.dumps({"logged_in": False, "username": None, "token_valid": False, "api_reachable": None, "api_url": API_BASE_URL}))
        else:
            header("STATUS")
            table = Table(box=box.SIMPLE, show_header=False, pad_edge=False)
            table.add_column("Check", style=DIM, width=18)
            table.add_column("Result", style="bold white")
            table.add_row("Auth", f"[{ERROR}]Not logged in[/{ERROR}]")
            table.add_row("Hint", f"[{DIM}]Run: clutch login[/{DIM}]")
            console.print(table)
            footer()
        raise SystemExit()

    token_valid = False
    api_reachable = False

    try:
        response = httpx.get(
            f"{API_BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
        )
        api_reachable = True
        token_valid = response.status_code == 200
    except httpx.RequestError:
        pass

    if json_output:
        typer.echo(json.dumps({"logged_in": True, "username": username, "token_valid": token_valid, "api_reachable": api_reachable, "api_url": API_BASE_URL}))
        return

    header("STATUS")
    table = Table(box=box.SIMPLE, show_header=False, pad_edge=False)
    table.add_column("Check", style=DIM, width=18)
    table.add_column("Result", style="bold white")
    table.add_row("User", f"[{ACCENT}]@{username}[/{ACCENT}]")
    if api_reachable:
        if token_valid:
            table.add_row("Token", f"[{SUCCESS}]Valid[/{SUCCESS}]")
            table.add_row("API", f"[{SUCCESS}]Reachable[/{SUCCESS}]  [{DIM}]{API_BASE_URL}[/{DIM}]")
        else:
            table.add_row("Token", f"[{WARNING}]Expired[/{WARNING}]")
            table.add_row("Hint", f"[{DIM}]Run: clutch login[/{DIM}]")
    else:
        table.add_row("Token", f"[{SUCCESS}]Saved[/{SUCCESS}]")
        table.add_row("API", f"[{ERROR}]Unreachable[/{ERROR}]")
    console.print(table)
    footer()
