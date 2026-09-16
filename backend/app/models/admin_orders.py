from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class AdminOrderStatusUpdate(BaseModel):
    """Payload para actualizar el estado operativo de un pedido."""
    status: OrderStatus
    tracking_number: Optional[str] = Field(None, max_length=100, description="Código de seguimiento logístico")
    notes: Optional[str] = Field(None, description="Notas internas de administración")


class AdminShippingZoneCreate(BaseModel):
    """Payload para crear una nueva zona tarifaria de envío."""
    zone_name: str = Field(..., min_length=2, max_length=100)
    postal_code_ranges: List[Dict[str, Any]] = Field(..., description="Lista de rangos [{from: 1000, to: 1499}]")
    cost: Decimal = Field(..., ge=0)
    estimated_days: int = Field(..., gt=0)
    is_active: bool = True


class AdminShippingZoneUpdate(BaseModel):
    """Payload para editar una zona tarifaria existente."""
    zone_name: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code_ranges: Optional[List[Dict[str, Any]]] = None
    cost: Optional[Decimal] = Field(None, ge=0)
    estimated_days: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
