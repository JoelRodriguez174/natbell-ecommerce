from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from supabase import Client

from app.models.admin_orders import (
    AdminOrderStatusUpdate,
    AdminShippingZoneCreate,
    AdminShippingZoneUpdate,
)


def _as_dict_list(raw_data: Any) -> List[Dict[str, Any]]:
    if isinstance(raw_data, list):
        return [item for item in raw_data if isinstance(item, dict)]
    if isinstance(raw_data, dict):
        return [raw_data]
    return []


def _as_first_dict(raw_data: Any) -> Dict[str, Any]:
    items = _as_dict_list(raw_data)
    return items[0] if items else {}


class AdminOrderService:
    def __init__(self, db: Client):
        self.db = db

    async def list_orders(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Dict[str, Any]:
        """Obtiene el listado paginado de órdenes de compra con filtros."""
        page = max(1, page)
        per_page = max(1, min(100, per_page))
        start = (page - 1) * per_page
        end = start + per_page - 1

        query = self.db.table("orders").select("*, order_items(*)", count="exact")

        if status:
            query = query.eq("status", status)

        if search:
            clean_search = search.strip()
            # Búsqueda por número de orden o nombre de cliente
            query = query.or_(
                f"order_number.ilike.%{clean_search}%,customer_name.ilike.%{clean_search}%,customer_email.ilike.%{clean_search}%"
            )

        res = query.order("created_at", desc=True).range(start, end).execute()
        rows = _as_dict_list(res.data) if res else []
        total_count = res.count if hasattr(res, "count") and res.count is not None else len(rows)

        return {
            "items": rows,
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": (total_count + per_page - 1) // per_page if total_count > 0 else 1,
        }

    async def get_order_detail(self, order_number: str) -> Dict[str, Any]:
        """Obtiene la información completa de una orden con sus items."""
        res = (
            self.db.table("orders")
            .select("*, order_items(*)")
            .eq("order_number", order_number)
            .execute()
        )
        row = _as_first_dict(res.data) if res else {}
        if not row:
            raise KeyError(f"Orden {order_number} no encontrada")
        return row

    async def update_order_status(
        self,
        order_number: str,
        payload: AdminOrderStatusUpdate,
    ) -> Dict[str, Any]:
        """Actualiza el estado operativo, notas o tracking de una orden."""
        order_res = self.db.table("orders").select("id, status").eq("order_number", order_number).execute()
        order_row = _as_first_dict(order_res.data) if order_res else {}
        if not order_row:
            raise KeyError(f"Orden {order_number} no encontrada")

        update_data: Dict[str, Any] = {
            "status": payload.status.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if payload.tracking_number is not None:
            update_data["tracking_number"] = payload.tracking_number.strip()
        if payload.notes is not None:
            update_data["notes"] = payload.notes.strip()

        res = (
            self.db.table("orders")
            .update(update_data)
            .eq("order_number", order_number)
            .execute()
        )
        updated = _as_first_dict(res.data) if res else {}
        return updated or update_data


class AdminShippingService:
    def __init__(self, db: Client):
        self.db = db

    async def list_zones(self) -> List[Dict[str, Any]]:
        """Lista todas las zonas de envío configuradas en el sistema."""
        res = self.db.table("shipping_zones").select("*").order("cost", desc=False).execute()
        return _as_dict_list(res.data) if res else []

    async def create_zone(self, payload: AdminShippingZoneCreate) -> Dict[str, Any]:
        """Crea una nueva zona tarifaria de envío."""
        record = {
            "zone_name": payload.zone_name.strip(),
            "postal_code_ranges": payload.postal_code_ranges,
            "cost": float(payload.cost),
            "estimated_days": payload.estimated_days,
            "is_active": payload.is_active,
        }
        res = self.db.table("shipping_zones").insert(record).execute()
        created = _as_first_dict(res.data) if res else {}
        if not created:
            raise RuntimeError("No se pudo crear la zona de envío")
        return created

    async def update_zone(self, zone_id: UUID, payload: AdminShippingZoneUpdate) -> Dict[str, Any]:
        """Actualiza una zona de envío existente."""
        update_data: Dict[str, Any] = {}
        if payload.zone_name is not None:
            update_data["zone_name"] = payload.zone_name.strip()
        if payload.postal_code_ranges is not None:
            update_data["postal_code_ranges"] = payload.postal_code_ranges
        if payload.cost is not None:
            update_data["cost"] = float(payload.cost)
        if payload.estimated_days is not None:
            update_data["estimated_days"] = payload.estimated_days
        if payload.is_active is not None:
            update_data["is_active"] = payload.is_active

        if not update_data:
            res = self.db.table("shipping_zones").select("*").eq("id", str(zone_id)).execute()
            return _as_first_dict(res.data) if res else {}

        res = self.db.table("shipping_zones").update(update_data).eq("id", str(zone_id)).execute()
        updated = _as_first_dict(res.data) if res else {}
        if not updated:
            raise KeyError(f"Zona de envío {zone_id} no encontrada")
        return updated
