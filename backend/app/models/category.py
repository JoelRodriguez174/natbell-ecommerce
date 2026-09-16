from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SubcategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True


class SubcategoryCreate(SubcategoryBase):
    category_id: UUID


class Subcategory(SubcategoryBase):
    id: UUID
    category_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: UUID
    created_at: datetime
    subcategories: list[Subcategory] = []

    model_config = ConfigDict(from_attributes=True)
