import json
import os
from pathlib import Path

CONFIG_DIR = Path.home() / ".clutch"
CONFIG_FILE = CONFIG_DIR / "config.json"
API_BASE_URL = os.getenv("CLUTCH_API_URL", "https://clutch-api-7lw4.onrender.com")

def save_token(token: str, username: str) -> None:
    """Save auth token to local config file."""
    CONFIG_DIR.mkdir(exist_ok=True)
    config = {"token": token, "username": username}
    CONFIG_FILE.write_text(json.dumps(config, indent=2))


def load_config() -> dict:
    """Load config from local file."""
    if not CONFIG_FILE.exists():
        return {}
    return json.loads(CONFIG_FILE.read_text())


def get_token() -> str | None:
    """Get saved auth token."""
    return load_config().get("token")


def get_username() -> str | None:
    """Get saved username."""
    return load_config().get("username")


def clear_config() -> None:
    """Remove saved config."""
    if CONFIG_FILE.exists():
        CONFIG_FILE.unlink()
