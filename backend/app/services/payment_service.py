import hashlib
import hmac
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import mercadopago

from app.config import settings
from app.models.order import Order, PaymentPreferenceResult

logger = logging.getLogger(__name__)


class PaymentProvider(ABC):
    """Interfaz abstracta para proveedores de pago en Natbell."""

    @abstractmethod
    async def create_checkout_preference(self, order: Order) -> PaymentPreferenceResult:
        """Crea la orden o preferencia de pago y retorna la URL de redirección."""
        pass

    @abstractmethod
    async def verify_webhook_signature(
        self, headers: Dict[str, Any], body: bytes, data_id: Optional[str] = None
    ) -> bool:
        """Verifica la firma criptográfica HMAC de las notificaciones entrantes."""
        pass

    @abstractmethod
    async def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        """Consulta el estado del pago en la pasarela externa."""
        pass


class MockPaymentProvider(PaymentProvider):
    """Proveedor simulado para desarrollo local y pruebas automatizadas sin depender de MercadoPago."""

    async def create_checkout_preference(self, order: Order) -> PaymentPreferenceResult:
        pref_id = f"mock-pref-{order.order_number}"
        mock_checkout_url = (
            f"{settings.frontend_url}/pago/simulador"
            f"?order_number={order.order_number}&total={order.total}&pref_id={pref_id}"
        )
        return PaymentPreferenceResult(
            preference_id=pref_id,
            init_point=mock_checkout_url,
            sandbox_init_point=mock_checkout_url,
        )

    async def verify_webhook_signature(
        self, headers: Dict[str, Any], body: bytes, data_id: Optional[str] = None
    ) -> bool:
        # En modo mock se aceptan todas las solicitudes legítimas de testing
        return True

    async def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        return {
            "id": payment_id,
            "status": "approved",
            "status_detail": "accredited",
            "transaction_amount": 1000.0,
            "date_approved": "2026-09-16T12:00:00.000Z",
        }


class MercadoPagoProvider(PaymentProvider):
    """Proveedor de pago oficial conectado a la API de MercadoPago Checkout Pro."""

    def __init__(self, access_token: Optional[str] = None):
        token = access_token or settings.mercadopago_access_token
        self._sdk = mercadopago.SDK(token)

    async def create_checkout_preference(self, order: Order) -> PaymentPreferenceResult:
        items = []
        for item in order.items:
            items.append(
                {
                    "id": str(item.product_variant_id or item.sku),
                    "title": f"{item.product_name} - {item.variant_name}",
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "currency_id": "ARS",
                }
            )

        if order.shipping_cost > 0:
            items.append(
                {
                    "id": "shipping_fee",
                    "title": f"Costo de Envío ({order.shipping_city}, {order.shipping_province})",
                    "quantity": 1,
                    "unit_price": float(order.shipping_cost),
                    "currency_id": "ARS",
                }
            )

        preference_data = {
            "items": items,
            "external_reference": order.order_number,
            "payer": {
                "name": order.customer_name,
                "email": order.customer_email,
                "phone": {"number": order.customer_phone},
                "address": {
                    "street_name": order.shipping_address,
                    "zip_code": order.shipping_postal_code,
                },
            },
            "back_urls": {
                "success": f"{settings.frontend_url}/pago/exitoso?order={order.order_number}",
                "pending": f"{settings.frontend_url}/pago/pendiente?order={order.order_number}",
                "failure": f"{settings.frontend_url}/pago/fallido?order={order.order_number}",
            },
            "statement_descriptor": "NATBELL",
        }

        # auto_return solo es admitido por MercadoPago cuando las URLs son públicas (HTTPS)
        if settings.frontend_url.startswith("https://"):
            preference_data["auto_return"] = "approved"

        try:
            preference_response = self._sdk.preference().create(preference_data)
            resp = preference_response.get("response", {})
            pref_id = resp.get("id", "")
            init_point = resp.get("init_point", "")
            sandbox_init_point = resp.get("sandbox_init_point", init_point)

            if not init_point:
                raise ValueError(f"MercadoPago no devolvió init_point: {preference_response}")

            return PaymentPreferenceResult(
                preference_id=pref_id,
                init_point=init_point,
                sandbox_init_point=sandbox_init_point,
            )
        except Exception as e:
            logger.error(f"Error al crear preferencia de MercadoPago: {e}", exc_info=True)
            raise

    async def verify_webhook_signature(
        self, headers: Dict[str, Any], body: bytes, data_id: Optional[str] = None
    ) -> bool:
        """Verifica la cabecera x-signature de Mercado Pago según su documentación oficial:
        x-signature: ts=...,v1=...
        HMAC-SHA256(manifest, secret)
        donde manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
        """
        secret = (settings.mercadopago_webhook_secret or "").strip()
        if not secret:
            # Si no hay secret configurado en local/dev, permitir si no hay validación estricta
            logger.warning("MERCADOPAGO_WEBHOOK_SECRET no configurado, saltando validación HMAC")
            return True

        x_signature = headers.get("x-signature") or headers.get("X-Signature")
        x_request_id = headers.get("x-request-id") or headers.get("X-Request-Id", "")

        if not x_signature:
            logger.warning("Firma x-signature no presente en la petición de webhook")
            return False

        parts = dict(part.split("=", 1) for part in x_signature.split(",") if "=" in part)
        ts = parts.get("ts")
        v1_hash = parts.get("v1")

        if not ts or not v1_hash:
            return False

        # El manifest oficial de Mercado Pago: id:[data.id];request-id:[x-request-id];ts:[ts];
        manifests = []
        if data_id:
            manifests.append(f"id:{data_id};request-id:{x_request_id};ts:{ts};")
        manifests.append(f"request-id:{x_request_id};ts:{ts};")

        for m in manifests:
            expected_hash = hmac.new(
                secret.encode("utf-8"),
                m.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()
            if hmac.compare_digest(v1_hash, expected_hash):
                return True

        return False

    async def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        try:
            payment_info = self._sdk.payment().get(payment_id)
            return payment_info.get("response", {})
        except Exception as e:
            logger.error(f"Error consultando pago {payment_id} en MercadoPago: {e}", exc_info=True)
            raise


def get_payment_provider() -> PaymentProvider:
    """Factory que resuelve el proveedor de pagos según la configuración activa."""
    mode = getattr(settings, "mercadopago_mode", "auto")
    token = getattr(settings, "mercadopago_access_token", "")

    if mode == "mock" or (mode == "auto" and not token):
        return MockPaymentProvider()

    return MercadoPagoProvider(access_token=token)
