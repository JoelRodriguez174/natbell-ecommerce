from decimal import Decimal
from uuid import uuid4
from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest
from app.models.order import Order, OrderItem, OrderStatus, PaymentPreferenceResult
from app.services.payment_service import (
    PaymentProvider,
    MockPaymentProvider,
    MercadoPagoProvider,
    get_payment_provider,
)


@pytest.fixture
def sample_order():
    order_id = uuid4()
    item = OrderItem(
        id=uuid4(),
        order_id=order_id,
        product_variant_id=uuid4(),
        product_name="Shampoo Ácido 1000ml",
        variant_name="1000ml",
        sku="NOV-1001",
        quantity=2,
        unit_price=Decimal("4500.00"),
        subtotal=Decimal("9000.00"),
    )
    return Order(
        id=order_id,
        order_number="ORD-2026-00001",
        status=OrderStatus.PENDING,
        customer_name="Camila Gomez",
        customer_email="camila@example.com",
        customer_phone="1155667788",
        shipping_address="Calle Falsa 123",
        shipping_city="Quilmes",
        shipping_province="Buenos Aires",
        shipping_postal_code="1878",
        shipping_cost=Decimal("1500.00"),
        subtotal=Decimal("9000.00"),
        total=Decimal("10500.00"),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        items=[item],
    )


@pytest.mark.anyio
async def test_mock_payment_provider_create_preference(sample_order):
    provider = MockPaymentProvider()
    res = await provider.create_checkout_preference(sample_order)
    assert isinstance(res, PaymentPreferenceResult)
    assert "ORD-2026-00001" in res.init_point
    assert res.preference_id.startswith("mock-pref-")


@pytest.mark.anyio
async def test_mock_payment_provider_verify_signature():
    provider = MockPaymentProvider()
    assert await provider.verify_webhook_signature({}, b"") is True


@pytest.mark.anyio
async def test_mercadopago_provider_create_preference(sample_order):
    provider = MercadoPagoProvider(access_token="TEST-fake-token")
    mock_mp_sdk = MagicMock()
    mock_pref_response = {
        "status": 201,
        "response": {
            "id": "mp-pref-12345",
            "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp-pref-12345",
            "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp-pref-12345",
        },
    }
    mock_mp_sdk.preference().create.return_value = mock_pref_response

    with patch.object(provider, "_sdk", mock_mp_sdk):
        res = await provider.create_checkout_preference(sample_order)
        assert res.preference_id == "mp-pref-12345"
        assert "mercadopago" in res.init_point


def test_get_payment_provider_fallback_to_mock():
    with patch("app.services.payment_service.settings") as mock_settings:
        mock_settings.mercadopago_access_token = ""
        mock_settings.mercadopago_mode = "auto"
        provider = get_payment_provider()
        assert isinstance(provider, MockPaymentProvider)


def test_get_payment_provider_real_when_token_set():
    with patch("app.services.payment_service.settings") as mock_settings:
        mock_settings.mercadopago_access_token = "TEST-123456789"
        mock_settings.mercadopago_mode = "auto"
        provider = get_payment_provider()
        assert isinstance(provider, MercadoPagoProvider)
