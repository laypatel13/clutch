import importlib
import sys


def reload_configuration_after_env(monkeypatch):
    # Ensure fresh import after setting env vars
    if "app.configuration" in sys.modules:
        del sys.modules["app.configuration"]


def test_default_settings(monkeypatch):
    # Check the defaults declared in code, not whatever this machine's .env or
    # shell sets — otherwise a local port change or database swap fails the test.
    for name in ("DATABASE_URL", "FRONTEND_URL", "ENVIRONMENT"):
        monkeypatch.delenv(name, raising=False)
    from app.configuration import Settings

    defaults = Settings(_env_file=None)

    assert defaults.DATABASE_URL.startswith("sqlite:///")
    assert defaults.FRONTEND_URL == "http://localhost:5173"
    assert defaults.ENVIRONMENT == "development"


def test_env_override(monkeypatch):
    reload_configuration_after_env(monkeypatch)
    monkeypatch.setenv("FRONTEND_URL", "http://example.com")

    # Import after setting env so BaseSettings reads the new value
    config = importlib.import_module("app.configuration")
    assert config.settings.FRONTEND_URL == "http://example.com"
