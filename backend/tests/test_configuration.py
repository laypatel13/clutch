import importlib
import sys


def reload_configuration_after_env(monkeypatch):
    # Ensure fresh import after setting env vars
    if "app.configuration" in sys.modules:
        del sys.modules["app.configuration"]


def test_default_settings():
    import app.configuration as config

    assert config.settings.DATABASE_URL.startswith("sqlite:///")
    assert config.settings.FRONTEND_URL == "http://localhost:5173"
    assert config.settings.ENVIRONMENT == "development"


def test_env_override(monkeypatch):
    reload_configuration_after_env(monkeypatch)
    monkeypatch.setenv("FRONTEND_URL", "http://example.com")

    # Import after setting env so BaseSettings reads the new value
    config = importlib.import_module("app.configuration")
    assert config.settings.FRONTEND_URL == "http://example.com"
