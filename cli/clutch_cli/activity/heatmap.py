import typer
from rich import box
from rich.panel import Panel
from rich.text import Text

from clutch_cli.api import get_client
from clutch_cli.theme import ACCENT, DIM, SUCCESS, WARNING, console, footer, header


def _cell_style(count: int, max_count: int) -> str:
    """Map a contribution count to a terminal style."""
    if count <= 0:
        return DIM

    ratio = count / max(max_count, 1)
    if ratio <= 0.25:
        return DIM
    if ratio <= 0.5:
        return ACCENT
    if ratio <= 0.75:
        return WARNING
    return SUCCESS


def _cell_char(count: int) -> str:
    """Map a contribution count to a unicode block."""
    if count <= 0:
        return "·"
    if count <= 1:
        return "░"
    if count <= 3:
        return "▒"
    if count <= 6:
        return "▓"
    return "█"


def heatmap(
    weeks: int = typer.Option(
        12,
        "--weeks",
        "-w",
        min=1,
        max=20,
        help="Number of weeks to display.",
    ),
):
    """Show your contribution heatmap."""
    with get_client() as client:
        try:
            console.print()
            console.print(f"[{DIM}]Fetching contribution heatmap...[/{DIM}]")

            response = client.get("/github/heatmap")
            if response.status_code != 200:
                console.print("[bold red]Error: Failed to fetch heatmap data.[/bold red]")
                raise typer.Exit(1)

            data = response.json()
            days = data.get("days", [])

            if not days:
                console.print(f"[{WARNING}]No contribution data available.[/{WARNING}]")
                raise typer.Exit()

            padded_days = []
            first_weekday = None
            for day in days:
                weekday = _weekday_index(day["date"])
                if first_weekday is None:
                    first_weekday = weekday
                    padded_days.extend([None] * first_weekday)
                padded_days.append(day)

            while len(padded_days) % 7 != 0:
                padded_days.append(None)

            week_rows = [padded_days[i : i + 7] for i in range(0, len(padded_days), 7)]
            shown_weeks = week_rows[-weeks:]

            header("CONTRIBUTION HEATMAP")
            console.print(
                f"[{DIM}]Last {weeks} weeks • Total: [/{DIM}][{ACCENT}]{data['total_contributions']}[/{ACCENT}]"
            )
            console.print()

            heatmap = Text()
            heatmap.append("Week  Mon Tue Wed Thu Fri Sat Sun\n", style=DIM)

            for index, week in enumerate(shown_weeks, start=1):
                heatmap.append(f"Week {index:<2} ", style=DIM)
                for day in week:
                    if day is None:
                        heatmap.append("    ")
                        continue

                    count = day["count"]
                    style = _cell_style(count, data.get("max_count", 1))
                    char = _cell_char(count)
                    heatmap.append(f" {char}  ", style=style)
                if index != len(shown_weeks):
                    heatmap.append("\n")

            console.print(
                Panel.fit(
                    heatmap,
                    box=box.ROUNDED,
                    border_style=DIM,
                    padding=(1, 2),
                )
            )
            console.print(
                f"[{DIM}]Legend:[/{DIM}] [dim]·[/dim] zero  [dim]░[/dim] low  "
                f"[{ACCENT}]▒[/{ACCENT}] medium  [{WARNING}]▓[/{WARNING}] high  "
                f"[{SUCCESS}]█[/{SUCCESS}] max"
            )
            footer()

        except typer.Exit:
            raise
        except Exception:
            console.print("[bold red]Error: Could not connect to Clutch API.[/bold red]")
            raise typer.Exit(1)


def _weekday_index(date_string: str) -> int:
    """Return Monday-based weekday index for an ISO date string."""
    from datetime import date

    return date.fromisoformat(date_string).weekday()
