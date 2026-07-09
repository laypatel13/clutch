import typer
from rich.console import Console
from rich.table import Table
from clutch_cli.api import get_language_breakdown

console = Console()

def languages():
    """Display a clean breakdown of your most used programming languages."""
    try:
        with console.status("[bold green]Fetching language metrics..."):
            data = get_language_breakdown()
        
        if not data:
            console.print("[yellow]No language data found.[/yellow]")
            return

        # Standardize the data format automatically
        items_list = []
        
        if isinstance(data, list):
            items_list = data
        elif isinstance(data, dict):
            if "languages" in data and isinstance(data["languages"], list):
                items_list = data["languages"]
            elif "data" in data and isinstance(data["data"], list):
                items_list = data["data"]
            else:
                # Handles direct key-value formats like {"Python": {"bytes": 123}}
                for lang_name, stats in data.items():
                    if isinstance(stats, dict):
                        items_list.append({
                            "language": lang_name,
                            "bytes": stats.get("bytes", 0),
                            "percentage": stats.get("percentage", 0.0)
                        })
                    elif isinstance(stats, (int, float)):
                        items_list.append({
                            "language": lang_name,
                            "bytes": 0,
                            "percentage": stats
                        })

        if not items_list:
            console.print("[yellow]Could not parse language metrics format.[/yellow]")
            return

        # Initialize the Rich Table with repo styling rules
        from rich.box import SIMPLE
        table = Table(box=SIMPLE, expand=True)
        table.add_column("Language", style="bold cyan", no_wrap=True)
        table.add_column("Bytes Used", justify="right")
        table.add_column("Percentage", justify="right")

        # Populate rows safely
        for item in items_list:
            if isinstance(item, dict):
                language = item.get("language", "Unknown")
                
                raw_bytes = item.get("bytes", 0)
                bytes_used = f"{raw_bytes:,}" if isinstance(raw_bytes, (int, float)) else str(raw_bytes)
                
                raw_percentage = item.get("percentage", 0.0)
                percentage = f"{raw_percentage:.1f}%" if isinstance(raw_percentage, (int, float)) else str(raw_percentage)
                
                table.add_row(language, bytes_used, percentage)

        console.print(table)

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")