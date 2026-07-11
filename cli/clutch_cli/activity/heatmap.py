import typer
from clutch_cli.api import get_client
from clutch_cli.theme import console, header, footer, ACCENT
from datetime import datetime

MAX_WEEKS = 20


def contribution_symbol(count: int, max_count: int) -> str:
    if count == 0:
        return "░"

    ratio = count / max_count

    if ratio <= 0.25:
        return "▒"
    elif ratio <= 0.50:
        return "▓"
    else:
        return "█"



def group_into_weeks(days: list, weeks: int) -> list:
    """Return the last `weeks` calendar weeks."""

    if not days:
        return []

    days = days.copy()

    # Today's weekday from the last contribution date
    last_date = datetime.strptime(days[-1]["date"], "%Y-%m-%d")
    weekday = last_date.weekday()      # Monday=0 ... Sunday=6

    # Pad future days so the current week ends on Sunday
    for _ in range(6 - weekday):
        days.append(None)

    # Pad the beginning so every row has exactly 7 days
    while len(days) % 7 != 0:
        days.insert(0, None)

    # Split into weeks
    weeks_data = [
        days[i:i + 7]
        for i in range(0, len(days), 7)
    ]

    # Return only the requested number of weeks
    return weeks_data[-weeks:]
def print_heatmap(
    weeks_data: list,
    total_weeks: int,
    total_contributions: int,
    max_count: int,
) -> None:
    """Print the final ASCII heatmap."""
    header_row = f"{'Week':<8} {'Mon':^3} {'Tue':^3} {'Wed':^3} {'Thu':^3} {'Fri':^3} {'Sat':^3} {'Sun':^3}"
    console.print(header_row, style="bold " + ACCENT)
    

    for index, week in enumerate(weeks_data, start=1):
        symbols = []

        for day in week:
            if day is None:
                symbols.append(" ")
            else:
                symbols.append(
                    contribution_symbol(day["count"], max_count)
                )

        console.print(
            f"{f'Week {index}':<8} "
            + " ".join(f"{symbol:^3}" for symbol in symbols)
        )
    console.print()
    console.print(
        f"Showing {total_weeks} week{'s' if total_weeks != 1 else ''} of data • {total_contributions} total contributions"
    )


def heatmap(
    weeks: int = typer.Option(
        12,
        "--weeks",
        help="Number of weeks to display.",
        min=1,
        max=MAX_WEEKS,
    )
):
    """Display GitHub contribution heatmap."""

    with get_client() as client:
        try:
            response = client.get(f"/github/heatmap")

            if response.status_code != 200:
                console.print("[bold red]Error: Failed to fetch heatmap.[/bold red]")
                raise typer.Exit(1)

            data = response.json()
            username = data["username"]
            total = data["total_contributions"]
            max_count = data["max_count"]
            days = data["days"]

            weeks_data = group_into_weeks(days, weeks)

            header("CONTRIBUTION HEATMAP")

            console.print(
                f"[bold]{username}[/bold]",
                justify="center"
            )

            console.print(
                f"Last {weeks} weeks • Total: [bold]{total}[/bold] contributions\n",
                justify="center",
            )

            print_heatmap(weeks_data, len(weeks_data), total, max_count)
            footer()

        except Exception as exc:
            console.print(f"[bold red]Error:[/bold red] {exc}")
            raise typer.Exit(1)
