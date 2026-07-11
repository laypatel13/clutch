from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_ready():
    r = client.get("/ready")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"
    assert body.get("db") == "ok"
