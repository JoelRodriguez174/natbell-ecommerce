import json
import logging
import re
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, List, Optional

from supabase import Client

from app.models.shipping import ShippingQuote

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
        "zone_name": "GBA (Gran Buenos Aires)",
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


def _as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Convierte de forma segura datos de PostgREST en una lista de diccionarios tipados."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def _as_first_dict(data: Any) -> Optional[Dict[str, Any]]:
    """Obtiene de forma segura el primer diccionario de un payload de PostgREST."""
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    if isinstance(data, dict):
        return data
    return None


def extract_numeric_postal_code(postal_code: str) -> int:
    """
    Normaliza y extrae el código postal numérico argentino (1000 a 9999).
    Soporta formatos: '1414', 'C1414CAB', 'B1602XYZ', ' 1414 '.
    Rechaza códigos con más de 4 dígitos o fuera de rango.
    """
    if not postal_code or not isinstance(postal_code, str):
        raise ValueError("El código postal es requerido")

    cleaned = postal_code.strip().upper()

    # Prevenir que números de más de 4 dígitos (ej: 12345) sean truncados silenciosamente
    if re.search(r"\d{5,}", cleaned):
        raise ValueError("El código postal debe contener exactamente 4 dígitos numéricos")

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

        # 1. Intentar consultar zonas activas desde Supabase ordenadas por menor costo
        if db is not None:
            try:
                response = (
                    db.table("shipping_zones")
                    .select("*")
                    .eq("is_active", True)
                    .order("cost", desc=False)
                    .execute()
                )
                zones = _as_dict_list(response.data) if response else []

                for zone in zones:
                    raw_ranges = zone.get("postal_code_ranges") or []
                    # Parseo defensivo en caso de que Supabase devuelva el JSONB como string
                    if isinstance(raw_ranges, str):
                        try:
                            raw_ranges = json.loads(raw_ranges)
                        except Exception:
                            raw_ranges = []

                    ranges_list = _as_dict_list(raw_ranges)
                    for r in ranges_list:
                        from_val = int(r.get("from") or r.get("from_code") or 0)
                        to_val = int(r.get("to") or r.get("to_code") or 0)
                        if from_val <= cp_num <= to_val:
                            days_val = int(zone.get("estimated_days") or 3)
                            return ShippingQuote(
                                zone_name=str(zone.get("zone_name") or "Zona Estándar"),
                                cost=Decimal(str(zone.get("cost") or "5000.00")),
                                estimated_days=days_val,
                                postal_code=cp_str,
                                provider="fixed_rate",
                                description=f"Entrega estimada en {days_val} días hábiles",
                            )
            except Exception as e:
                logger.warning(f"Error consultando shipping_zones en Supabase: {e}. Usando fallback local.")

        # 2. Fallback con zonas predeterminadas si la BD no arrojó coincidencia o falló la conexión
        for item in DEFAULT_ZONES_CONFIG:
            for r in item["ranges"]:
                if r["from"] <= cp_num <= r["to"]:
                    return ShippingQuote(
                        zone_name=str(item["zone_name"]),
                        cost=Decimal(str(item["cost"])),
                        estimated_days=int(item["days"]),
                        postal_code=cp_str,
                        provider="fixed_rate",
                        description=str(item["description"]),
                    )

        # Si por alguna razón excede, retornar interior general
        fallback = DEFAULT_ZONES_CONFIG[-1]
        return ShippingQuote(
            zone_name=str(fallback["zone_name"]),
            cost=Decimal(str(fallback["cost"])),
            estimated_days=int(fallback["days"]),
            postal_code=cp_str,
            provider="fixed_rate",
            description=str(fallback["description"]),
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
        """Lista todas las zonas configuradas con tipos consistentes."""
        if db is not None:
            try:
                response = db.table("shipping_zones").select("*").order("cost", desc=False).execute()
                zones_data = _as_dict_list(response.data) if response else []
                if zones_data:
                    return [
                        {
                            "zone_name": str(item.get("zone_name") or ""),
                            "cost": float(Decimal(str(item.get("cost") or 0.0))),
                            "estimated_days": int(item.get("estimated_days") or 3),
                            "description": f"Entrega estimada en {item.get('estimated_days') or 3} días hábiles",
                        }
                        for item in zones_data
                    ]
            except Exception as e:
                logger.warning(f"Error listando zonas desde Supabase: {e}")

        return [
            {
                "zone_name": str(item["zone_name"]),
                "cost": float(Decimal(str(item["cost"]))),
                "estimated_days": int(item["days"]),
                "description": str(item["description"]),
            }
            for item in DEFAULT_ZONES_CONFIG
        ]


# Instancia singleton del servicio
shipping_service = ShippingService()
