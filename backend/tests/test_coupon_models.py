from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models.coupon import (
    CouponCreate,
    CouponUpdate,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.models.order import OrderBase, OrderCheckoutRequest


def test_coupon_code_uppercase_normalization():
    coupon = CouponCreate(code=" verano20 ", discount_percent=20)
    assert coupon.code == "VERANO20"
    assert coupon.discount_percent == 20
    assert coupon.is_active is True
    assert coupon.max_uses is None
    assert coupon.expires_at is None


def test_coupon_discount_percent_bounds():
    # 0 debe fallar
    with pytest.raises(ValidationError):
        CouponCreate(code="INVALID0", discount_percent=0)

    # 101 debe fallar
    with pytest.raises(ValidationError):
        CouponCreate(code="INVALID101", discount_percent=101)

    # Negativo debe fallar
    with pytest.raises(ValidationError):
        CouponCreate(code="NEG", discount_percent=-5)

    # 1 y 100 deben pasar
    c1 = CouponCreate(code="MIN1", discount_percent=1)
    assert c1.discount_percent == 1
    c100 = CouponCreate(code="MAX100", discount_percent=100)
    assert c100.discount_percent == 100


def test_coupon_empty_code_fails():
    with pytest.raises(ValidationError):
        CouponCreate(code="   ", discount_percent=10)


def test_coupon_update_schema():
    update = CouponUpdate(is_active=False, max_uses=50)
    assert update.is_active is False
    assert update.max_uses == 50
    assert update.expires_at is None


def test_coupon_validate_request_and_response():
    req = CouponValidateRequest(code=" promo15 ")
    assert req.code == "PROMO15"

    resp = CouponValidateResponse(valid=True, code=req.code, discount_percent=15)
    assert resp.valid is True
    assert resp.code == "PROMO15"
    assert resp.discount_percent == 15


def test_order_models_include_coupon_and_discount():
    order_base = OrderBase(
        customer_name="Test Customer",
        customer_email="test@example.com",
        customer_phone="1122334455",
        shipping_address="Calle 123",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1414",
        shipping_cost=Decimal("1500.00"),
        subtotal=Decimal("10000.00"),
        total=Decimal("10500.00"),
        coupon_code="VERANO10",
        discount_amount=Decimal("1000.00"),
    )
    assert order_base.coupon_code == "VERANO10"
    assert order_base.discount_amount == Decimal("1000.00")

    checkout_req = OrderCheckoutRequest(
        customer_name="Test Customer",
        customer_email="test@example.com",
        customer_phone="1122334455",
        shipping_address="Calle 123",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1414",
        shipping_cost=Decimal("1500.00"),
        coupon_code="VERANO10",
        items=[
            {"product_variant_id": "00000000-0000-0000-0000-000000000001", "quantity": 1}
        ],
    )
    assert checkout_req.coupon_code == "VERANO10"
