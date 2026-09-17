from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import get_supabase_client
from app.main import app
from app.services.email_service import get_email_service
from app.utils.security import hash_password

client = TestClient(app)

TEST_ADMIN_ID = str(uuid4())
TEST_EMAIL = "nuevo.admin@natbell.com"
TEST_PASSWORD = "Password123!"
VALID_INVITE_CODE = settings.admin_invite_code
INVALID_INVITE_CODE = "WrongCode123!"


@pytest.fixture
def mock_email_service():
    service = MagicMock()
    service.send_verification_email = AsyncMock(return_value=True)
    service.send_password_reset_email = AsyncMock(return_value=True)
    return service


def test_register_invalid_invite_code():
    """Register fails when company invite code does not match settings."""
    res = client.post(
        "/api/admin/auth/register",
        json={
            "name": "Carlos Gomez",
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "invite_code": INVALID_INVITE_CODE,
        },
    )
    assert res.status_code == 400
    assert "Clave de empresa inválida" in res.json()["detail"]


def test_register_already_verified_user(mock_email_service):
    """Register fails if an active, verified admin already has that email."""
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
                "is_verified": True,
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_email_service] = lambda: mock_email_service

    try:
        res = client.post(
            "/api/admin/auth/register",
            json={
                "name": "Carlos Gomez",
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "invite_code": VALID_INVITE_CODE,
            },
        )
        assert res.status_code == 400
        assert "ya se encuentra registrado" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_register_success_new_admin(mock_email_service):
    """Successful registration creates unverified admin and dispatches verification email."""
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_insert = MagicMock()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(data=[])  # No existing user
    mock_table.insert.return_value = mock_insert
    mock_insert.execute.return_value = MagicMock(data=[{"id": TEST_ADMIN_ID}])

    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_email_service] = lambda: mock_email_service

    try:
        res = client.post(
            "/api/admin/auth/register",
            json={
                "name": "Carlos Gomez",
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "invite_code": VALID_INVITE_CODE,
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert "enviado exitosamente" in data["message"]
        assert data["email"] == TEST_EMAIL
        mock_email_service.send_verification_email.assert_called_once()
    finally:
        app.dependency_overrides.clear()


def test_verify_email_success(mock_email_service):
    """Correct OTP verifies email and returns JWT token."""
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_update = MagicMock()
    mock_update_eq = MagicMock()

    valid_expiry = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "name": "Carlos Gomez",
                "is_verified": False,
                "verification_code": "123456",
                "verification_code_expires_at": valid_expiry,
                "created_at": "2026-09-17T12:00:00Z",
            }
        ]
    )

    mock_table.update.return_value = mock_update
    mock_update.eq.return_value = mock_update_eq
    mock_update_eq.execute.return_value = MagicMock(data=[{"id": TEST_ADMIN_ID}])

    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_email_service] = lambda: mock_email_service

    try:
        res = client.post(
            "/api/admin/auth/verify-email",
            json={"email": TEST_EMAIL, "code": "123456"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["token_type"] == "bearer"
    finally:
        app.dependency_overrides.clear()


def test_verify_email_wrong_code(mock_email_service):
    """Incorrect OTP returns 400 error."""
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()

    valid_expiry = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "is_verified": False,
                "verification_code": "123456",
                "verification_code_expires_at": valid_expiry,
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_email_service] = lambda: mock_email_service

    try:
        res = client.post(
            "/api/admin/auth/verify-email",
            json={"email": TEST_EMAIL, "code": "999999"},
        )
        assert res.status_code == 400
        assert "incorrecto" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_verify_email_expired_code(mock_email_service):
    """Expired OTP returns 400 error."""
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()

    expired = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "is_verified": False,
                "verification_code": "123456",
                "verification_code_expires_at": expired,
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_email_service] = lambda: mock_email_service

    try:
        res = client.post(
            "/api/admin/auth/verify-email",
            json={"email": TEST_EMAIL, "code": "123456"},
        )
        assert res.status_code == 400
        assert "expirado" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_login_blocked_if_unverified():
    """Admin cannot login if is_verified is False."""
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
                "password_hash": hash_password(TEST_PASSWORD),
                "name": "Carlos Gomez",
                "is_verified": False,
            }
        ]
    )

    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        res = client.post(
            "/api/admin/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        assert res.status_code == 403
        assert "no ha sido verificada" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_forgot_and_reset_password_flow(mock_email_service):
    """Forgot password sends code, reset password updates hash."""
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_update = MagicMock()
    mock_update_eq = MagicMock()

    mock_db.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "name": "Carlos Gomez",
                "is_verified": True,
            }
        ]
    )

    mock_table.update.return_value = mock_update
    mock_update.eq.return_value = mock_update_eq
    mock_update_eq.execute.return_value = MagicMock(data=[{"id": TEST_ADMIN_ID}])

    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_email_service] = lambda: mock_email_service

    try:
        # 1. Forgot password request
        res = client.post(
            "/api/admin/auth/forgot-password",
            json={"email": TEST_EMAIL},
        )
        assert res.status_code == 200
        mock_email_service.send_password_reset_email.assert_called_once()

        # 2. Reset password request with matching code
        valid_expiry = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        mock_eq.execute.return_value = MagicMock(
            data=[
                {
                    "id": TEST_ADMIN_ID,
                    "email": TEST_EMAIL,
                    "name": "Carlos Gomez",
                    "reset_password_code": "888888",
                    "reset_password_expires_at": valid_expiry,
                }
            ]
        )

        res_reset = client.post(
            "/api/admin/auth/reset-password",
            json={
                "email": TEST_EMAIL,
                "code": "888888",
                "new_password": "BrandNewPassword123!",
            },
        )
        assert res_reset.status_code == 200
        assert "exitosamente" in res_reset.json()["message"]
    finally:
        app.dependency_overrides.clear()
