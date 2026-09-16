from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    logo_url: Optional[str] = None
    is_active: bool = True


class BrandCreate(BrandBase):
    pass


class Brand(BrandBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
