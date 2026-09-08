import logging
from decimal import Decimal
from typing import Dict, Any, List, Optional
import mercadopago
from app.config import settings
from app.database import supabase

logger = logging.getLogger("payment_service")


class PaymentService:
    @classmethod
    def get_sdk(cls):
        return mercadopago.SDK(settings.mercadopago_access_token)

    @classmethod
    def create_preference(
        cls,
        order_number: str,
        items: List[Dict[str, Any]],
        shipping_cost: Decimal,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
    ) -> Dict[str, Any]:
        """Create a MercadoPago Checkout Pro preference and return preference_id and init_point."""
        mp_items = []
        for item in items:
            mp_items.append({
                "title": f"{item['product_name']} ({item['variant_name']})",
                "quantity": int(item["quantity"]),
                "currency_id": "ARS",
                "unit_price": float(item["unit_price"]),
            })

        if shipping_cost > 0:
            mp_items.append({
                "title": "Costo de Envío",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(shipping_cost),
            })

        preference_data = {
            "items": mp_items,
            "payer": {
                "name": customer_name,
                "email": customer_email,
                "phone": {"number": customer_phone},
            },
            "back_urls": {
                "success": f"{settings.frontend_url}/checkout/success?order={order_number}",
                "failure": f"{settings.frontend_url}/checkout/failure?order={order_number}",
                "pending": f"{settings.frontend_url}/checkout/pending?order={order_number}",
            },
            "auto_return": "approved",
            "external_reference": order_number,
            "notification_url": f"{settings.backend_url}/api/webhooks/mercadopago",
            "statement_descriptor": "LOS ARRAYANES",
        }

        try:
            sdk = cls.get_sdk()
            pref_response = sdk.preference().create(preference_data)
            response_data = pref_response.get("response", {})

            # In test mode with dummy keys, fallback gracefully
            pref_id = response_data.get("id", f"pref_mock_{order_number}")
            init_point = response_data.get(
                "init_point",
                f"https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id={pref_id}",
            )
            sandbox_init_point = response_data.get(
                "sandbox_init_point", init_point
            )

            return {
                "preference_id": pref_id,
                "init_point": init_point,
                "sandbox_init_point": sandbox_init_point,
            }
        except Exception as e:
            logger.warning(f"Could not connect to MercadoPago live API: {e}. Using fallback URL.")
            return {
                "preference_id": f"pref_mock_{order_number}",
                "init_point": f"{settings.frontend_url}/checkout/success?order={order_number}&mock=true",
                "sandbox_init_point": f"{settings.frontend_url}/checkout/success?order={order_number}&mock=true",
            }

    @classmethod
    def get_payment_info(cls, mp_payment_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve payment details directly from MercadoPago API."""
        try:
            sdk = cls.get_sdk()
            payment_info = sdk.payment().get(mp_payment_id)
            return payment_info.get("response")
        except Exception as e:
            logger.error(f"Error fetching MercadoPago payment {mp_payment_id}: {e}")
            return None
