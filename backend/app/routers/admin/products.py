import re
import unicodedata
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.middleware.admin_auth import get_current_admin
from app.models.admin import (
    AdminProductCreate,
    AdminProductUpdate,
    AdminVariantCreate,
    AdminVariantUpdate,
)
from app.database import supabase

router = APIRouter(
    prefix="/api/admin/products",
    tags=["Admin Products"],
    dependencies=[Depends(get_current_admin)],
)


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)


@router.get("")
async def list_admin_products(
    q: Optional[str] = Query(default=None),
    category_id: Optional[UUID] = Query(default=None),
    brand_id: Optional[UUID] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    """List products for admin management including variants and active/inactive status."""
    query = supabase.table("products").select(
        "*, brand:brands(name), subcategory:subcategories(name, category:categories(name)), product_variants(*)",
        count="exact",
    )

    if q:
        query = query.ilike("name", f"%{q}%")
    if brand_id:
        query = query.eq("brand_id", str(brand_id))
    if category_id:
        query = query.eq("subcategory.category_id", str(category_id))
    if is_active is not None:
        query = query.eq("is_active", is_active)

    offset = (page - 1) * per_page
    query = query.order("created_at", desc=True).range(offset, offset + per_page - 1)

    res = query.execute()
    items = res.data or []
    total = res.count if res.count is not None else len(items)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{product_id}")
async def get_admin_product(product_id: UUID):
    """Retrieve detailed product info with all its variants."""
    res = (
        supabase.table("products")
        .select("*, brand:brands(*), subcategory:subcategories(*), variants:product_variants(*)")
        .eq("id", str(product_id))
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )
    return res.data[0]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_admin_product(req: AdminProductCreate):
    """Create a new product."""
    slug = req.slug or slugify(req.name)

    insert_data = {
        "subcategory_id": str(req.subcategory_id),
        "brand_id": str(req.brand_id),
        "name": req.name,
        "slug": slug,
        "description": req.description,
        "base_price": float(req.base_price),
        "is_featured": req.is_featured,
        "is_on_sale": req.is_on_sale,
        "sale_price": float(req.sale_price) if req.sale_price else None,
        "image_urls": req.image_urls,
        "is_active": req.is_active,
    }

    try:
        res = supabase.table("products").insert(insert_data).execute()
        return res.data[0] if res.data else insert_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear el producto: {str(e)}",
        )


@router.put("/{product_id}")
async def update_admin_product(product_id: UUID, req: AdminProductUpdate):
    """Update product information."""
    update_data = {}
    if req.subcategory_id is not None:
        update_data["subcategory_id"] = str(req.subcategory_id)
    if req.brand_id is not None:
        update_data["brand_id"] = str(req.brand_id)
    if req.name is not None:
        update_data["name"] = req.name
    if req.slug is not None:
        update_data["slug"] = req.slug
    if req.description is not None:
        update_data["description"] = req.description
    if req.base_price is not None:
        update_data["base_price"] = float(req.base_price)
    if req.is_featured is not None:
        update_data["is_featured"] = req.is_featured
    if req.is_on_sale is not None:
        update_data["is_on_sale"] = req.is_on_sale
    if req.sale_price is not None:
        update_data["sale_price"] = float(req.sale_price)
    if req.image_urls is not None:
        update_data["image_urls"] = req.image_urls
    if req.is_active is not None:
        update_data["is_active"] = req.is_active

    if not update_data:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar")

    try:
        res = supabase.table("products").update(update_data).eq("id", str(product_id)).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error actualizando producto: {str(e)}",
        )


@router.delete("/{product_id}")
async def delete_admin_product(product_id: UUID):
    """Soft delete product by setting is_active to False."""
    res = (
        supabase.table("products")
        .update({"is_active": False})
        .eq("id", str(product_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto desactivado correctamente", "id": str(product_id)}


# ---------------------------------------------------------
# Variants Management
# ---------------------------------------------------------
@router.post("/{product_id}/variants", status_code=status.HTTP_201_CREATED)
async def create_admin_variant(product_id: UUID, req: AdminVariantCreate):
    """Create a new variant for a product."""
    insert_data = {
        "product_id": str(product_id),
        "sku": req.sku.strip(),
        "variant_name": req.variant_name.strip(),
        "price_override": float(req.price_override) if req.price_override else None,
        "stock": req.stock,
        "is_active": req.is_active,
    }
    try:
        res = supabase.table("product_variants").insert(insert_data).execute()
        return res.data[0] if res.data else insert_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear variante: {str(e)}",
        )


@router.put("/{product_id}/variants/{variant_id}")
async def update_admin_variant(
    product_id: UUID, variant_id: UUID, req: AdminVariantUpdate
):
    """Update variant price, stock, or status."""
    update_data = {}
    if req.sku is not None:
        update_data["sku"] = req.sku.strip()
    if req.variant_name is not None:
        update_data["variant_name"] = req.variant_name.strip()
    if req.price_override is not None:
        update_data["price_override"] = float(req.price_override)
    if req.stock is not None:
        update_data["stock"] = req.stock
    if req.is_active is not None:
        update_data["is_active"] = req.is_active

    if not update_data:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar")

    res = (
        supabase.table("product_variants")
        .update(update_data)
        .eq("id", str(variant_id))
        .eq("product_id", str(product_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    return res.data[0]


@router.delete("/{product_id}/variants/{variant_id}")
async def delete_admin_variant(product_id: UUID, variant_id: UUID):
    """Soft delete variant."""
    res = (
        supabase.table("product_variants")
        .update({"is_active": False})
        .eq("id", str(variant_id))
        .eq("product_id", str(product_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    return {"message": "Variante desactivada", "id": str(variant_id)}
