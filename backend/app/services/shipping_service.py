import re
import logging
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Optional, List, Dict, Any
from supabase import Client
from app.models.shipping import ShippingQuote, ShippingZone

logger = logging.getLogger(__name__)

# Tarifas por defecto para contingencia en caso de que la tabla esté vacía
DEFAULT_ZONES_CONFIG = [
    {
        "zone_name": "CABA",
        "ranges": [{"from": 1000, "to": 1499}],
        "cost": Decimal("3500.00"),
        "days": 2,
        "description": "Entrega express en Ciudad Autónoma de Buenos Aires",
    },
    {
        "zone_name": "Gran Buenos Aires (GBA)",
        "ranges": [{"from": 1500, "to": 1999}],
        "cost": Decimal("5000.00"),
        "days": 3,
        "description": "Envío a primer y segundo cordón del Gran Buenos Aires",
    },
    {
        "zone_name": "Interior del País",
        "ranges": [{"from": 2000, "to": 9999}],
        "cost": Decimal("7500.00"),
        "days": 5,
        "description": "Despacho a todas las provincias de la República Argentina",
    },
]


def extract_numeric_postal_code(postal_code: str) -> int:
    """
    Normaliza y extrae el código postal numérico argentino (1000 a 9999).
    Soporta formatos: '1414', 'C1414CAB', 'B1602XYZ', ' 1414 '.
    """
    if not postal_code or not isinstance(postal_code, str):
        raise ValueError("El código postal es requerido")

    cleaned = postal_code.strip().upper()
    match = re.search(r"\d{4}", cleaned)
    if not match:
        raise ValueError("El código postal debe contener 4 dígitos numéricos válidos (ej: 1414 o C1414CAB)")

    cp_num = int(match.group(0))
    if cp_num < 1000 or cp_num > 9999:
        raise ValueError("Código postal fuera del rango válido de Argentina (1000 - 9999)")

    return cp_num


class ShippingProvider(ABC):
    """Interfaz abstracta que deben implementar todos los proveedores de envío (Patrón Strategy)."""

    @abstractmethod
    def calculate_quote(self, postal_code: str, db: Optional[Client] = None) -> ShippingQuote:
        """Calcula la cotización para el código postal especificado."""
        pass


class FixedRateProvider(ShippingProvider):
    """
    Estrategia de cotización basada en zonas fijas y rangos de código postal.
    Consulta la tabla `shipping_zones` en Supabase o utiliza la configuración por defecto.
    """

    def calculate_quote(self, postal_code: str, db: Optional[Client] = None) -> ShippingQuote:
        cp_num = extract_numeric_postal_code(postal_code)
        cp_str = str(cp_num)

        # 1. Intentar consultar zonas activas desde Supabase
        if db is not None:
            try:
                response = (
                    db.table("shipping_zones")
                    .select("*")
                    .eq("is_active", True)
                    .execute()
                )
                zones = response.data if response and hasattr(response, "data") else []

                for zone in zones:
                    ranges = zone.get("postal_code_ranges") or []
                    for r in ranges:
                        from_val = int(r.get("from") or r.get("from_code") or 0)
                        to_val = int(r.get("to") or r.get("to_code") or 0)
                        if from_val <= cp_num <= to_val:
                            return ShippingQuote(
                                zone_name=zone.get("zone_name", "Zona Estándar"),
                                cost=Decimal(str(zone.get("cost", "5000.00"))),
                                estimated_days=int(zone.get("estimated_days", 3)),
                                postal_code=cp_str,
                                provider="fixed_rate",
                                description=f"Entrega estimada en {zone.get('estimated_days', 3)} días hábiles",
                            )
            except Exception as e:
                logger.warning(f"Error consultando shipping_zones en Supabase: {e}. Usando fallback local.")

        # 2. Fallback con zonas predeterminadas si la BD no arrojó coincidencia o falló la conexión
        for item in DEFAULT_ZONES_CONFIG:
            for r in item["ranges"]:
                if r["from"] <= cp_num <= r["to"]:
                    return ShippingQuote(
                        zone_name=item["zone_name"],
                        cost=item["cost"],
                        estimated_days=item["days"],
                        postal_code=cp_str,
                        provider="fixed_rate",
                        description=item["description"],
                    )

        # Si por alguna razón excede, retornar interior general
        fallback = DEFAULT_ZONES_CONFIG[-1]
        return ShippingQuote(
            zone_name=fallback["zone_name"],
            cost=fallback["cost"],
            estimated_days=fallback["days"],
            postal_code=cp_str,
            provider="fixed_rate",
            description=fallback["description"],
        )


class ShippingService:
    """
    Servicio de envíos de la aplicación.
    Permite intercambiar el proveedor dinámicamente mediante el patrón Strategy.
    """

    def __init__(self, provider: Optional[ShippingProvider] = None):
        self._provider = provider or FixedRateProvider()

    def set_provider(self, provider: ShippingProvider) -> None:
        """Permite intercambiar la estrategia de cotización en tiempo de ejecución."""
        self._provider = provider

    def quote(self, postal_code: str, db: Optional[Client] = None) -> ShippingQuote:
        """Delega la cotización a la estrategia actualmente configurada."""
        return self._provider.calculate_quote(postal_code, db=db)

    def list_zones(self, db: Optional[Client] = None) -> List[Dict[str, Any]]:
        """Lista todas las zonas configuradas."""
        if db is not None:
            try:
                response = db.table("shipping_zones").select("*").execute()
                if response and hasattr(response, "data") and response.data:
                    return response.data
            except Exception as e:
                logger.warning(f"Error listando zonas desde Supabase: {e}")

        return [
            {
                "zone_name": item["zone_name"],
                "cost": float(item["cost"]),
                "estimated_days": item["days"],
                "description": item["description"],
            }
            for item in DEFAULT_ZONES_CONFIG
        ]


# Instancia singleton del servicio
shipping_service = ShippingService()
