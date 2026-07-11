import typer

from clutch_cli.authentication import login, logout, whoami
from clutch_cli.activity import streak, stats, patterns, heatmap
from clutch_cli.repositories import list as repositories_list
from clutch_cli.insights import weekly
from clutch_cli.system import status
from clutch_cli.repositories.languages import languages as languages_command

__version__ = "0.3.0"

app = typer.Typer(
    name="clutch",
    help="GitHub tracks your work. Clutch tracks you.",
    no_args_is_help=True,
)


def _version_callback(value: bool):
    if value:
        typer.echo(
            f"clutch {__version__}\n"
            "GitHub: https://github.com/laypatel13/clutch/releases\n"
            "PyPI: https://pypi.org/project/clutch-cli"
        )      
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        None,
        "--version",
        "-v",
        help="Show version and exit.",
        callback=_version_callback,
        is_eager=True,
    ),
):
    pass


# Authentication
app.command(name="login")(login.login)
app.command(name="logout")(logout.logout)
app.command(name="whoami")(whoami.whoami)

# Activity
app.command(name="streak")(streak.streak)
app.command(name="stats")(stats.stats)
app.command(name="patterns")(patterns.patterns)
app.command(name="heatmap")(heatmap.heatmap)

# Repositories
app.command(name="repos")(repositories_list.repos)

# Insights
app.command(name="insight")(weekly.insight)

# System
app.command(name="status")(status.status)

@app.command(name="lang")
def lang():
    """Show programming language breakdown."""
    languages_command()

if __name__ == "__main__":
    app()
