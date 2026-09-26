import typer

from clutch_cli.authentication import login, logout, whoami
from clutch_cli.activity import streak, stats, patterns, heatmap
from clutch_cli.repositories import languages, repos
from clutch_cli.insights import insight
from clutch_cli.system import status
from clutch_cli.theme import banner

__version__ = "0.4.0"

app = typer.Typer(
    name="clutch",
    help="GitHub tracks your work. Clutch tracks you.",
    no_args_is_help=False,
)


def _version_callback(value: bool):
    if value:
        typer.echo(
            f"clutch {__version__}\n"
            "GitHub: https://github.com/laypatel13/clutch/releases\n"
            "PyPI: https://pypi.org/project/myclutch"
        )
        raise typer.Exit()


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    version: bool = typer.Option(
        None,
        "--version",
        "-v",
        help="Show version and exit.",
        callback=_version_callback,
        is_eager=True,
    ),
):
    if ctx.invoked_subcommand is None:
        banner(version=__version__)
        typer.echo(ctx.get_help())
        raise typer.Exit()


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
app.command(name="repos")(repos.repos)

# Insights
app.command(name="insight")(insight.insight)

# System
app.command(name="status")(status.status)

# Languages is listed last in `clutch --help`, where it has always been.
app.command(name="lang", help="Show programming language breakdown.")(languages.languages)

if __name__ == "__main__":
    app()
