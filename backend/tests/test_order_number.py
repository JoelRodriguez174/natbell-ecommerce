from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from app.models.order import (
    OrderCheckoutItem,
    OrderCheckoutRequest,
    OrderCreateResponse,
    OrderStatus,
)
from app.utils.order_number import generate_order_number, parse_order_sequence


def test_generate_order_number_format():
    num = generate_order_number(1, year=2026)
    assert num == "ORD-2026-00001"
    assert len(num) == 14


def test_generate_order_number_padding():
    num = generate_order_number(125, year=2026)
    assert num == "ORD-2026-00125"


def test_generate_order_number_default_year():
    num = generate_order_number(42)
    current_year = datetime.now().year
    assert num.startswith(f"ORD-{current_year}-")
    assert num.endswith("00042")


def test_parse_order_sequence():
    seq = parse_order_sequence("ORD-2026-00342")
    assert seq == 342
    assert parse_order_sequence("invalid-code") is None


def test_order_checkout_schemas():
    item = OrderCheckoutItem(product_variant_id=str(uuid4()), quantity=2)
    assert item.quantity == 2

    req = OrderCheckoutRequest(
        customer_name="Valeria Rossi",
        customer_email="valeria@example.com",
        customer_phone="1123456789",
        shipping_address="Av. Corrientes 1234",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1043",
        shipping_cost=Decimal("1500.00"),
        items=[item],
    )
    assert req.customer_name == "Valeria Rossi"
    assert len(req.items) == 1

    resp = OrderCreateResponse(
        order_id=uuid4(),
        order_number="ORD-2026-00001",
        status=OrderStatus.PENDING,
        subtotal=Decimal("12000.00"),
        shipping_cost=Decimal("1500.00"),
        total=Decimal("13500.00"),
        checkout_url="http://localhost:3000/pago/simulador?order=ORD-2026-00001",
    )
    assert resp.order_number == "ORD-2026-00001"
    assert resp.total == Decimal("13500.00")
