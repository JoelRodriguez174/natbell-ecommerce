from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from uuid import UUID

from supabase import Client

from app.models.admin_dashboard import (
    AdminDashboardMetricsResponse,
    LowStockVariantItem,
    RecentOrderItem,
)
from app.models.order import OrderStatus
from app.utils.postgrest import as_dict_list as _as_dict_list
from app.utils.postgrest import parse_datetime as _parse_datetime


class AdminDashboardService:
    def __init__(self, db: Client):
        self.db = db

    async def get_metrics(self) -> AdminDashboardMetricsResponse:
        """Calcula las métricas de negocio para el dashboard del administrador."""
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
        except Exception:
            pass

        # 1. Consulta de todas las órdenes
        orders_res = (
            self.db.table("orders")
            .select("id, order_number, customer_name, status, total, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        orders_data = _as_dict_list(orders_res.data) if orders_res else []

        total_orders = len(orders_data)
        total_revenue = Decimal("0.00")
        today_revenue = Decimal("0.00")

        pending_orders = 0
        paid_orders = 0
        shipped_orders = 0
        delivered_orders = 0

        now_utc = datetime.now(timezone.utc)
        today_date = now_utc.date()

        recent_orders: List[RecentOrderItem] = []

        for idx, o in enumerate(orders_data):
            st = str(o.get("status", ""))
            tot = Decimal(str(o.get("total", "0.00")))
            created_dt = _parse_datetime(o.get("created_at"))

            if st == OrderStatus.PENDING.value:
                pending_orders += 1
            elif st == OrderStatus.PAID.value:
                paid_orders += 1
            elif st == OrderStatus.SHIPPED.value:
                shipped_orders += 1
            elif st == OrderStatus.DELIVERED.value:
                delivered_orders += 1

            # Ingresos contabilizados de órdenes concretadas
            if st in (OrderStatus.PAID.value, OrderStatus.SHIPPED.value, OrderStatus.DELIVERED.value):
                total_revenue += tot
                if created_dt and created_dt.date() == today_date:
                    today_revenue += tot

            # Primeras 5 órdenes para el resumen
            if idx < 5:
                recent_orders.append(
                    RecentOrderItem(
                        order_number=str(o.get("order_number", "")),
                        customer_name=str(o.get("customer_name", "Cliente")),
                        total=tot,
                        status=OrderStatus(st) if st in OrderStatus._value2member_map_ else OrderStatus.PENDING,
                        created_at=created_dt,
                    )
                )

        # 2. Consulta de variantes con stock crítico (<= 5)
        variants_res = (
            self.db.table("product_variants")
            .select("id, sku, variant_name, stock, products(name)")
            .lte("stock", 5)
            .eq("is_active", True)
            .order("stock", desc=False)
            .limit(10)
            .execute()
        )
        variants_data = _as_dict_list(variants_res.data) if variants_res else []

        low_stock_variants: List[LowStockVariantItem] = []
        for v in variants_data:
            prod_info = v.get("products")
            prod_name = (
                prod_info.get("name", "Producto")
                if isinstance(prod_info, dict)
                else "Producto"
            )
            low_stock_variants.append(
                LowStockVariantItem(
                    id=UUID(str(v.get("id"))),
                    product_name=prod_name,
                    variant_name=str(v.get("variant_name", "Estándar")),
                    sku=str(v.get("sku", "")),
                    stock=int(v.get("stock", 0)),
                )
            )

        return AdminDashboardMetricsResponse(
            total_revenue=total_revenue,
            today_revenue=today_revenue,
            total_orders=total_orders,
            pending_orders=pending_orders,
            paid_orders=paid_orders,
            shipped_orders=shipped_orders,
            delivered_orders=delivered_orders,
            low_stock_count=len(low_stock_variants),
            low_stock_variants=low_stock_variants,
            recent_orders=recent_orders,
        )
