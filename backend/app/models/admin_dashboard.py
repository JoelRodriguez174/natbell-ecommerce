from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class LowStockVariantItem(BaseModel):
    id: UUID
    product_name: str
    variant_name: str
    sku: str
    stock: int


class RecentOrderItem(BaseModel):
    order_number: str
    customer_name: str
    total: Decimal
    status: OrderStatus
    created_at: Optional[datetime] = None


class AdminDashboardMetricsResponse(BaseModel):
    total_revenue: Decimal = Field(..., description="Facturación acumulada histórica")
    today_revenue: Decimal = Field(..., description="Facturación generada en el día de hoy")
    total_orders: int = Field(..., description="Cantidad total histórica de órdenes")
    pending_orders: int = Field(..., description="Órdenes pendientes de pago")
    paid_orders: int = Field(..., description="Órdenes pagadas listas para despacho")
    shipped_orders: int = Field(..., description="Órdenes actualmente en tránsito / enviadas")
    delivered_orders: int = Field(..., description="Órdenes entregadas con éxito")
    low_stock_count: int = Field(..., description="Cantidad de variantes con stock crítico (<= 5)")
    low_stock_variants: List[LowStockVariantItem] = Field(default_factory=list)
    recent_orders: List[RecentOrderItem] = Field(default_factory=list)
