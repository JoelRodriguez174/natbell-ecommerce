from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.coupon import CouponCreate
from app.services.coupon_service import CouponService


@pytest.fixture
def mock_supabase():
    return MagicMock()


@pytest.fixture
def coupon_service(mock_supabase):
    return CouponService(db_client=mock_supabase)


def test_validate_coupon_success(coupon_service, mock_supabase):
    coupon_id = str(uuid4())
    mock_data = [
        {
            "id": coupon_id,
            "code": "VERANO20",
            "discount_percent": 20,
            "is_active": True,
            "max_uses": 100,
            "times_used": 5,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        }
    ]
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=mock_data)

    result = coupon_service.validate_coupon("verano20")
    assert result["code"] == "VERANO20"
    assert result["discount_percent"] == 20
    assert result["id"] == coupon_id


def test_validate_coupon_not_found(coupon_service, mock_supabase):
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[])

    with pytest.raises(HTTPException) as exc_info:
        coupon_service.validate_coupon("INEXISTENTE")
    assert exc_info.value.status_code == 404
    assert "no existe" in exc_info.value.detail.lower()


def test_validate_coupon_inactive(coupon_service, mock_supabase):
    mock_data = [
        {
            "id": str(uuid4()),
            "code": "INACTIVO10",
            "discount_percent": 10,
            "is_active": False,
            "max_uses": None,
            "times_used": 0,
            "expires_at": None,
        }
    ]
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=mock_data)

    with pytest.raises(HTTPException) as exc_info:
        coupon_service.validate_coupon("INACTIVO10")
    assert exc_info.value.status_code == 400
    assert "inactivo" in exc_info.value.detail.lower()


def test_validate_coupon_expired(coupon_service, mock_supabase):
    mock_data = [
        {
            "id": str(uuid4()),
            "code": "VENCIDO15",
            "discount_percent": 15,
            "is_active": True,
            "max_uses": None,
            "times_used": 2,
            "expires_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        }
    ]
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=mock_data)

    with pytest.raises(HTTPException) as exc_info:
        coupon_service.validate_coupon("VENCIDO15")
    assert exc_info.value.status_code == 400
    assert "expirado" in exc_info.value.detail.lower() or "venc" in exc_info.value.detail.lower()


def test_validate_coupon_max_uses_reached(coupon_service, mock_supabase):
    mock_data = [
        {
            "id": str(uuid4()),
            "code": "AGOTADO25",
            "discount_percent": 25,
            "is_active": True,
            "max_uses": 10,
            "times_used": 10,
            "expires_at": None,
        }
    ]
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=mock_data)

    with pytest.raises(HTTPException) as exc_info:
        coupon_service.validate_coupon("AGOTADO25")
    assert exc_info.value.status_code == 400
    assert "límite" in exc_info.value.detail.lower() or "agotó" in exc_info.value.detail.lower()


def test_create_coupon_duplicate(coupon_service, mock_supabase):
    mock_supabase.table().select().eq().execute.return_value = MagicMock(
        data=[{"id": str(uuid4()), "code": "EXISTE"}]
    )

    with pytest.raises(HTTPException) as exc_info:
        coupon_service.create_coupon(CouponCreate(code="EXISTE", discount_percent=10))
    assert exc_info.value.status_code == 400
    assert "ya existe" in exc_info.value.detail.lower()


def test_create_coupon_success(coupon_service, mock_supabase):
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[])
    created_id = str(uuid4())
    mock_supabase.table().insert().execute.return_value = MagicMock(
        data=[
            {
                "id": created_id,
                "code": "NUEVO10",
                "discount_percent": 10,
                "is_active": True,
                "max_uses": 50,
                "times_used": 0,
                "expires_at": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ]
    )

    created = coupon_service.create_coupon(
        CouponCreate(code="NUEVO10", discount_percent=10, max_uses=50)
    )
    assert created["id"] == created_id
    assert created["code"] == "NUEVO10"


def test_list_coupons(coupon_service, mock_supabase):
    mock_supabase.table().select().order().execute.return_value = MagicMock(
        data=[{"id": str(uuid4()), "code": "C1"}, {"id": str(uuid4()), "code": "C2"}]
    )
    coupons = coupon_service.list_coupons()
    assert len(coupons) == 2


def test_toggle_coupon_status(coupon_service, mock_supabase):
    coupon_id = str(uuid4())
    mock_supabase.table().update().eq().execute.return_value = MagicMock(
        data=[{"id": coupon_id, "is_active": False}]
    )
    res = coupon_service.toggle_status(coupon_id, False)
    assert res["is_active"] is False


def test_delete_coupon(coupon_service, mock_supabase):
    coupon_id = str(uuid4())
    mock_supabase.table().delete().eq().execute.return_value = MagicMock(
        data=[{"id": coupon_id}]
    )
    assert coupon_service.delete_coupon(coupon_id) is True


def test_validate_coupon_already_used_by_email(coupon_service, mock_supabase):
    coupon_id = str(uuid4())
    coupon_data = {
        "id": coupon_id,
        "code": "SOLOUNA",
        "discount_percent": 15,
        "is_active": True,
        "max_uses": 100,
        "times_used": 1,
        "expires_at": None,
    }

    def table_router(table_name):
        m = MagicMock()
        if table_name == "coupons":
            m.select().eq().execute.return_value = MagicMock(data=[coupon_data])
            return m
        elif table_name == "orders":
            m.select().eq().ilike().neq().execute.return_value = MagicMock(data=[{"id": "order-123"}])
            return m
        return m

    mock_supabase.table.side_effect = table_router

    with pytest.raises(HTTPException) as exc_info:
        coupon_service.validate_coupon("SOLOUNA", customer_email="cliente@ejemplo.com")
    assert exc_info.value.status_code == 400
    assert "ya has utilizado este cupón" in exc_info.value.detail.lower()


def test_validate_coupon_with_new_email_success(coupon_service, mock_supabase):
    coupon_id = str(uuid4())
    coupon_data = {
        "id": coupon_id,
        "code": "BIENVENIDA",
        "discount_percent": 10,
        "is_active": True,
        "max_uses": 100,
        "times_used": 0,
        "expires_at": None,
    }

    def table_router(table_name):
        m = MagicMock()
        if table_name == "coupons":
            m.select().eq().execute.return_value = MagicMock(data=[coupon_data])
            return m
        elif table_name == "orders":
            m.select().eq().ilike().neq().execute.return_value = MagicMock(data=[])
            return m
        return m

    mock_supabase.table.side_effect = table_router

    result = coupon_service.validate_coupon("BIENVENIDA", customer_email="nuevo@ejemplo.com")
    assert result["code"] == "BIENVENIDA"
