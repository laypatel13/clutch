import typer
from rich.table import Table
from rich import box
from clutch_cli.api import get_client
from clutch_cli.theme import console, ACCENT, DIM, WARNING, header, footer


def repos():
    """Show your most recently active repositories."""
    with get_client() as client:
        try:
            response = client.get("/github/repos")
            if response.status_code != 200:
                console.print("[bold red]Error: Failed to fetch repositories.[/bold red]")
                raise typer.Exit(1)

            repos_data = response.json()

            header("REPOSITORIES")

            table = Table(box=box.SIMPLE, show_header=True, pad_edge=False)
            table.add_column("Repository", style="bold white", width=28)
            table.add_column("Language", width=14)
            table.add_column("Stars", justify="right", width=7)
            table.add_column("Forks", justify="right", width=7)
            table.add_column("Updated", style=DIM, width=12)

            for repo in repos_data[:10]:
                lang = repo.get("language") or "—"
                stars = repo.get("stargazers_count", 0)
                forks = repo.get("forks_count", 0)

                table.add_row(
                    repo["name"],
                    lang,
                    f"[{WARNING}]{stars}[/{WARNING}]" if stars > 0 else f"[{DIM}]0[/{DIM}]",
                    str(forks) if forks > 0 else f"[{DIM}]0[/{DIM}]",
                    repo["updated_at"][:10],
                )

            console.print(table)
            footer()

        except Exception:
            console.print("[bold red]Error: Could not connect to Clutch API.[/bold red]")
            raise typer.Exit(1)
