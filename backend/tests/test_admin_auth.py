from datetime import timedelta
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.database import get_supabase_client
from app.main import app
from app.utils.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

client = TestClient(app)

TEST_ADMIN_ID = str(uuid4())
TEST_EMAIL = "admin@natbell.com"
TEST_PASSWORD = "SuperSecretPassword123!"
TEST_HASH = hash_password(TEST_PASSWORD)


def test_password_hash_and_verify():
    h = hash_password("mypassword")
    assert h != "mypassword"
    assert verify_password("mypassword", h) is True
    assert verify_password("wrongpassword", h) is False


def test_jwt_token_generation_and_decoding():
    token = create_access_token(
        subject=TEST_ADMIN_ID,
        claims={"email": TEST_EMAIL, "role": "admin"},
    )
    payload = decode_access_token(token)
    assert payload["sub"] == TEST_ADMIN_ID
    assert payload["email"] == TEST_EMAIL
    assert payload["role"] == "admin"
    assert "exp" in payload
    assert "iat" in payload


def test_expired_jwt_rejection():
    token = create_access_token(
        subject=TEST_ADMIN_ID,
        expires_delta=timedelta(seconds=-10),  # Expirado
    )
    with pytest.raises(ValueError, match="ha expirado"):
        decode_access_token(token)


def test_tampered_jwt_rejection():
    token = create_access_token(subject=TEST_ADMIN_ID)
    parts = token.split(".")
    # Alterar el payload
    tampered_token = f"{parts[0]}.eyJuYW1lIjoiZXZpbCJ9.{parts[2]}"
    with pytest.raises(ValueError, match="inválido"):
        decode_access_token(tampered_token)


def test_admin_login_success(monkeypatch):
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "password_hash": TEST_HASH,
                "name": "Administrador Principal",
                "created_at": "2026-09-16T12:00:00Z",
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        response = client.post(
            "/api/admin/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["id"] == TEST_ADMIN_ID
    finally:
        app.dependency_overrides.clear()


def test_admin_login_wrong_password(monkeypatch):
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "password_hash": TEST_HASH,
                "name": "Administrador Principal",
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        response = client.post(
            "/api/admin/auth/login",
            json={"email": TEST_EMAIL, "password": "wrong_password"},
        )
        assert response.status_code == 401
        assert "Credenciales inválidas" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_admin_login_user_not_found(monkeypatch):
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(data=[])

    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        response = client.post(
            "/api/admin/auth/login",
            json={"email": "nonexistent@natbell.com", "password": TEST_PASSWORD},
        )
        assert response.status_code == 401
        assert "Credenciales inválidas" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_admin_me_endpoint_flow(monkeypatch):
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "name": "Administrador Principal",
                "created_at": "2026-09-16T12:00:00Z",
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        token = create_access_token(subject=TEST_ADMIN_ID)

        # 1. Petición sin token -> 401
        res_no_auth = client.get("/api/admin/auth/me")
        assert res_no_auth.status_code == 401

        # 2. Petición con token inválido -> 401
        res_bad_auth = client.get(
            "/api/admin/auth/me",
            headers={"Authorization": "Bearer bad-token-here"},
        )
        assert res_bad_auth.status_code == 401

        # 3. Petición con token válido -> 200
        res_ok = client.get(
            "/api/admin/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_ok.status_code == 200
        data = res_ok.json()
        assert data["id"] == TEST_ADMIN_ID
        assert data["email"] == TEST_EMAIL
    finally:
        app.dependency_overrides.clear()
