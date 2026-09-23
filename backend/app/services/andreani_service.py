import logging
import re
import time
from typing import Any, Dict, Optional

import httpx

from app.config import settings

logger = logging.getLogger("natbell.shipping.andreani")


class AndreaniService:
    """
    Servicio de integración con la API oficial de Andreani PyME (ACOM).
    Permite autenticación automática y registro de envíos para obtener números de guía/tracking.
    """

    def __init__(
        self,
        credential_id: Optional[str] = None,
        base_url: Optional[str] = None,
        origin_postal_code: Optional[str] = None,
        timeout_seconds: float = 10.0,
    ):
        self.credential_id = (
            credential_id if credential_id is not None else settings.andreani_credential_id
        )
        self.base_url = (
            base_url or settings.andreani_api_base_url or "https://woocommerce-api-acom.andreani.com"
        ).rstrip("/")
        self.origin_postal_code = (
            origin_postal_code or settings.andreani_origin_postal_code or "1752"
        )
        self.timeout_seconds = timeout_seconds

        self._access_token: Optional[str] = None
        self._token_expiry_timestamp: float = 0.0

    def get_access_token(self) -> Optional[str]:
        """Obtiene o reutiliza el token de acceso JWT de la API de Andreani."""
        if not self.credential_id:
            return None

        now = time.time()
        if self._access_token and now < self._token_expiry_timestamp:
            return self._access_token

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                res = client.post(
                    f"{self.base_url}/api/v1/Login",
                    headers={
                        "Authorization": self.credential_id,
                        "Content-Type": "application/json",
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    token = data.get("response", {}).get("accessToken")
                    if token:
                        self._access_token = token
                        self._token_expiry_timestamp = now + 82800  # 23 horas de vigencia
                        return token
                logger.warning(
                    "Error al autenticar en Andreani API (%s): %s",
                    res.status_code,
                    res.text,
                )
        except Exception as exc:
            logger.error("Excepción al conectar con el login de Andreani API: %s", exc)

        return None

    def register_shipment(self, order: Dict[str, Any]) -> Dict[str, str]:
        """
        Registra la orden en la API de Andreani PyME y retorna el número de tracking generado.
        """
        if not self.credential_id:
            raise ValueError("No se encontraron credenciales configuradas para la API de Andreani.")

        token = self.get_access_token()
        if not token:
            raise RuntimeError("No se pudo autenticar con los servidores de Andreani. Verifique las credenciales.")

        # Separación inteligente de calle y altura
        raw_address = (order.get("shipping_address") or "").strip()
        is_branch = raw_address.startswith("Retiro en Sucursal")

        if is_branch:
            street = raw_address
            number = "S/N"
        else:
            match = re.search(r"(\d+)", raw_address)
            if match:
                number = match.group(1)
                street = raw_address[: match.start()].strip().rstrip(",") or "Calle"
            else:
                street = raw_address or "Domicilio"
                number = "1"

        # Nombre y apellido
        full_name = (order.get("customer_name") or "Cliente").strip()
        name_parts = full_name.split(" ", 1)
        name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "Cliente"

        # Contrato: estándar por defecto (400035538)
        payload = {
            "price_shipment": float(order.get("shipping_cost") or 0.0),
            "origin": {
                "postal_code": self.origin_postal_code,
            },
            "destination": {
                "postal_code": str(order.get("shipping_postal_code") or "1000").strip(),
                "locality": str(order.get("shipping_city") or "Buenos Aires").strip(),
                "street": street,
                "number": number,
                "province": str(order.get("shipping_province") or "Buenos Aires").strip(),
            },
            "recipient": {
                "name": name,
                "last_name": last_name,
                "phone_number": str(order.get("customer_phone") or "1144556677").strip(),
                "email": str(order.get("customer_email") or "info@natbell.com.ar").strip(),
            },
            "contract": {
                "id_contract": "400035538",
            },
            "email_merchant": "mgrodriguez77@hotmail.com",
            "remito": str(order.get("order_number") or ""),
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                res = client.post(
                    f"{self.base_url}/api/v1/Pyme/ShippingRegistration",
                    json=payload,
                    headers={
                        "X-Auth-Token": token,
                        "Authorization": token,
                        "Content-Type": "application/json",
                    },
                )
                if res.status_code in (200, 201):
                    data = res.json()
                    resp_obj = data.get("response", {})
                    tracking_number = (
                        resp_obj.get("numeroDeEnvio")
                        or resp_obj.get("trackingNumber")
                        or resp_obj.get("tracking_number")
                        or data.get("numeroDeEnvio")
                        or data.get("trackingNumber")
                    )

                    if not tracking_number:
                        logger.warning(
                            "Andreani registró el envío pero no devolvió numeroDeEnvio explícito: %s",
                            data,
                        )
                        tracking_number = str(order.get("order_number") or "ANDR000000")

                    return {
                        "tracking_number": tracking_number,
                        "tracking_url": f"https://www.andreani.com/#!/informacionEnvio/{tracking_number}",
                    }
                else:
                    logger.error(
                        "Error al registrar envío en Andreani (%d): %s",
                        res.status_code,
                        res.text,
                    )
                    raise RuntimeError(f"Error de Andreani API ({res.status_code}): {res.text}")
        except Exception as exc:
            logger.error("Excepción en register_shipment: %s", exc)
            raise


_andreani_service_instance = None


def get_andreani_service() -> AndreaniService:
    global _andreani_service_instance
    if _andreani_service_instance is None:
        _andreani_service_instance = AndreaniService()
    return _andreani_service_instance
