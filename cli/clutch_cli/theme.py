"""Shared visual theme for all Clutch CLI output.

One bold, monochrome accent system — no rainbow, no gradients.
Primary: bold white. Accent: bold (terminal default bright). Dim: grey.
Status: green (positive only), red (errors only), yellow (warnings only).
"""

import pyfiglet
from rich.console import Console

console = Console()

# Text styles
PRIMARY = "bold white"
ACCENT = "bold"          # bright/bold default terminal color — reads as black/white bold
DIM = "dim"
SUCCESS = "bold green"
ERROR = "bold red"
WARNING = "bold yellow"

BRAND = "⚡ CLUTCH"


def header(title: str) -> None:
    """Print the standard Clutch section header."""
    console.print()
    console.rule(f"[{ACCENT}]{BRAND} — {title.upper()}[/{ACCENT}]")
    console.print()


def banner(tagline: str = "GitHub tracks your work. Clutch tracks you.", version: str | None = None) -> None:
    """Print the big block-letter Clutch wordmark (bare `clutch` invocation)."""
    art = pyfiglet.figlet_format("CLUTCH", font="ansi_shadow")
    console.print()
    console.print(f"[{ACCENT}]{art}[/{ACCENT}]", end="")
    tail = tagline if not version else f"{tagline}  ·  v{version}"
    console.print(f"[{DIM}]{tail}[/{DIM}]")
    console.print()


def mini_banner() -> None:
    """Compact block-letter wordmark for lower-ceremony commands (e.g. status)."""
    art = pyfiglet.figlet_format("CLUTCH", font="small")
    console.print()
    console.print(f"[{ACCENT}]{art}[/{ACCENT}]", end="")


def footer() -> None:
    """Print the standard Clutch section footer."""
    console.print()
    console.rule(style=DIM)
    console.print()


def bar(value: float, max_value: float, width: int = 28) -> str:
    """Render a solid/empty block bar, bold white filled + dim empty."""
    max_value = max_value or 1
    filled = int((value / max_value) * width)
    filled = max(0, min(width, filled))
    return f"[{ACCENT}]{'█' * filled}[/{ACCENT}][{DIM}]{'░' * (width - filled)}[/{DIM}]"