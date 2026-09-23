import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from postgrest import CountMethod
from supabase import Client

from app.models.admin_orders import (
    AdminOrderStatusUpdate,
    AdminShippingZoneCreate,
    AdminShippingZoneUpdate,
)
from app.services.andreani_service import get_andreani_service
from app.services.email_service import get_email_service
from app.utils.postgrest import as_dict_list as _as_dict_list
from app.utils.postgrest import as_first_dict as _as_first_dict

logger = logging.getLogger("natbell.admin_orders")


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
        # Limpieza automática de órdenes pendientes abandonadas (+30 minutos de antigüedad)
        try:
            from datetime import timedelta
            cutoff = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
            abandoned_res = (
                self.db.table("orders")
                .select("id")
                .eq("status", "pending")
                .lt("created_at", cutoff)
                .execute()
            )
            abandoned_rows = _as_dict_list(abandoned_res.data) if abandoned_res else []
            abandoned_ids = [str(r["id"]) for r in abandoned_rows if "id" in r]
            if abandoned_ids:
                self.db.table("order_items").delete().in_("order_id", abandoned_ids).execute()
                self.db.table("orders").delete().in_("id", abandoned_ids).execute()
                logger.info("Se purgaron %d órdenes pendientes abandonadas", len(abandoned_ids))
        except Exception as exc:
            logger.debug("Aviso purgando órdenes abandonadas: %s", exc)

        page = max(1, page)
        per_page = max(1, min(100, per_page))
        start = (page - 1) * per_page
        end = start + per_page - 1

        query = self.db.table("orders").select("*, order_items(*)", count=CountMethod.exact)

        if status == "confirmed":
            query = query.in_("status", ["paid", "shipped", "delivered"])
        elif status and status != "all":
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

        current_status = str(order_row.get("status") or "")
        if current_status == "pending":
            raise ValueError(
                "Las órdenes en estado pendiente no pueden modificarse de estado manualmente. "
                "Deben ser acreditadas automáticamente por la pasarela de pagos."
            )

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

        # Notificar al cliente si se despacha el paquete y se provee tracking
        if payload.status.value == "shipped" and payload.tracking_number:
            try:
                full_order = await self.get_order_detail(order_number)
                customer_email = full_order.get("customer_email")
                customer_name = full_order.get("customer_name") or "Cliente"
                tracking_num = payload.tracking_number.strip()
                tracking_url = f"https://www.andreani.com/#!/informacionEnvio/{tracking_num}"
                if customer_email:
                    email_service = get_email_service()
                    await email_service.send_shipping_notification_email(
                        to_email=customer_email,
                        customer_name=customer_name,
                        order_number=order_number,
                        tracking_number=tracking_num,
                        tracking_url=tracking_url,
                    )
            except Exception as exc:
                logger.error("Error enviando email de despacho para orden %s: %s", order_number, exc)

        return updated or update_data

    async def generate_andreani_shipment(self, order_number: str) -> Dict[str, Any]:
        """
        Genera la imposición del envío en Andreani PyME ACOM,
        obtiene el tracking number asignado, actualiza la orden a 'shipped',
        y envía el email de notificación al cliente con el código de seguimiento.
        """
        order = await self.get_order_detail(order_number)

        andreani_service = get_andreani_service()
        shipment_result = andreani_service.register_shipment(order)

        tracking_number = shipment_result.get("tracking_number") or ""
        tracking_url = shipment_result.get("tracking_url") or (
            f"https://www.andreani.com/#!/informacionEnvio/{tracking_number}" if tracking_number else ""
        )

        update_data: Dict[str, Any] = {
            "status": "shipped",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if tracking_number:
            update_data["tracking_number"] = tracking_number

        res = (
            self.db.table("orders")
            .update(update_data)
            .eq("order_number", order_number)
            .execute()
        )
        updated = _as_first_dict(res.data) if res else {}

        customer_email = order.get("customer_email")
        customer_name = order.get("customer_name") or "Cliente"
        if customer_email and tracking_number:
            try:
                email_service = get_email_service()
                await email_service.send_shipping_notification_email(
                    to_email=customer_email,
                    customer_name=customer_name,
                    order_number=order_number,
                    tracking_number=tracking_number,
                    tracking_url=tracking_url,
                )
            except Exception as exc:
                logger.error("Error enviando email de despacho Andreani para %s: %s", order_number, exc)

        return {
            "order_number": order_number,
            "status": "shipped",
            "tracking_number": tracking_number,
            "tracking_url": tracking_url,
            "order": updated or {**order, **update_data},
        }


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
