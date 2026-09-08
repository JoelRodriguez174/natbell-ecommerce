from decimal import Decimal
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PostalCodeQuoteRequest(BaseModel):
    postal_code: str = Field(..., min_length=2, max_length=10)


class ShippingQuoteResponse(BaseModel):
    zone_name: str
    cost: Decimal
    estimated_days: int
    postal_code: str


class ShippingZoneBase(BaseModel):
    zone_name: str
    postal_code_ranges: List[Dict[str, str]]
    cost: Decimal = Field(..., ge=0)
    estimated_days: int = Field(..., gt=0)
    is_active: bool = True


class ShippingZoneCreate(ShippingZoneBase):
    pass


class ShippingZoneUpdate(BaseModel):
    zone_name: Optional[str] = None
    postal_code_ranges: Optional[List[Dict[str, str]]] = None
    cost: Optional[Decimal] = Field(default=None, ge=0)
    estimated_days: Optional[int] = Field(default=None, gt=0)
    is_active: Optional[bool] = None


class ShippingZoneResponse(ShippingZoneBase):
    id: UUID
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
