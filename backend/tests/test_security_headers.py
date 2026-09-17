from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)


def test_phase_is_eight():
    assert settings.phase == 8
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["phase"] == 8


def test_security_headers_present():
    response = client.get("/api/health")
    assert response.status_code == 200
    headers = response.headers

    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert "strict-transport-security" in headers
    assert "referrer-policy" in headers
    assert "content-security-policy" in headers
    assert "permissions-policy" in headers


def test_cors_headers_with_origin():
    # Origen permitido
    response = client.options(
        "/api/products",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_origins_property():
    assert "http://localhost:3000" in settings.cors_origins
