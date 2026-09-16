import re
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from supabase import Client

from app.models.admin_catalog import (
    AdminProductCreate,
    AdminProductUpdate,
)
from app.utils.slug import slugify


def _as_dict_list(raw_data: Any) -> List[Dict[str, Any]]:
    if isinstance(raw_data, list):
        return [item for item in raw_data if isinstance(item, dict)]
    if isinstance(raw_data, dict):
        return [raw_data]
    return []


def _as_first_dict(raw_data: Any) -> Dict[str, Any]:
    items = _as_dict_list(raw_data)
    return items[0] if items else {}


class AdminCatalogService:
    def __init__(self, db: Client):
        self.db = db

    async def _resolve_unique_slug(self, name: str, current_product_id: Optional[UUID] = None) -> str:
        base = slugify(name) or "producto"
        candidate = base
        suffix = 2

        while True:
            query = self.db.table("products").select("id").eq("slug", candidate)
            if current_product_id:
                query = query.neq("id", str(current_product_id))
            res = query.execute()
            rows = _as_dict_list(res.data) if res else []
            if not rows:
                return candidate
            candidate = f"{base}-{suffix}"
            suffix += 1

    async def create_product(self, payload: AdminProductCreate) -> Dict[str, Any]:
        """Crea un nuevo producto en el catálogo junto con sus variantes asociadas."""
        unique_slug = await self._resolve_unique_slug(payload.name)

        prod_record = {
            "name": payload.name,
            "slug": unique_slug,
            "description": payload.description,
            "category_id": str(payload.category_id),
            "brand_id": str(payload.brand_id),
            "base_price": float(payload.base_price),
            "sale_price": float(payload.sale_price) if payload.sale_price is not None else None,
            "is_on_sale": payload.is_on_sale,
            "is_featured": payload.is_featured,
            "is_active": payload.is_active,
            "image_urls": payload.images,
        }

        prod_res = self.db.table("products").insert(prod_record).execute()
        created_prod = _as_first_dict(prod_res.data) if prod_res else {}
        if not created_prod or not created_prod.get("id"):
            raise RuntimeError("No se pudo insertar el producto en la base de datos")

        prod_id = created_prod["id"]

        # Inserción de variantes asociadas
        variants_created: List[Dict[str, Any]] = []
        if payload.variants:
            for v in payload.variants:
                v_record = {
                    "product_id": prod_id,
                    "sku": v.sku.strip(),
                    "variant_name": v.variant_name.strip(),
                    "price_override": float(v.price_override) if v.price_override is not None else None,
                    "stock": v.stock,
                    "is_active": v.is_active,
                }
                v_res = self.db.table("product_variants").insert(v_record).execute()
                created_v = _as_first_dict(v_res.data) if v_res else {}
                if created_v:
                    variants_created.append(created_v)

        created_prod["variants"] = variants_created
        return created_prod

    async def update_product(self, product_id: UUID, payload: AdminProductUpdate) -> Dict[str, Any]:
        """Actualiza un producto existente en el catálogo."""
        update_data: Dict[str, Any] = {}

        if payload.name is not None:
            update_data["name"] = payload.name
            update_data["slug"] = await self._resolve_unique_slug(payload.name, current_product_id=product_id)
        if payload.description is not None:
            update_data["description"] = payload.description
        if payload.category_id is not None:
            update_data["category_id"] = str(payload.category_id)
        if payload.brand_id is not None:
            update_data["brand_id"] = str(payload.brand_id)
        if payload.base_price is not None:
            update_data["base_price"] = float(payload.base_price)
        if payload.sale_price is not None:
            update_data["sale_price"] = float(payload.sale_price)
        if payload.is_on_sale is not None:
            update_data["is_on_sale"] = payload.is_on_sale
        if payload.is_featured is not None:
            update_data["is_featured"] = payload.is_featured
        if payload.is_active is not None:
            update_data["is_active"] = payload.is_active
        if payload.images is not None:
            update_data["image_urls"] = payload.images

        if not update_data:
            res = self.db.table("products").select("*, product_variants(*)").eq("id", str(product_id)).execute()
            return _as_first_dict(res.data) if res else {}

        res = (
            self.db.table("products")
            .update(update_data)
            .eq("id", str(product_id))
            .execute()
        )
        updated = _as_first_dict(res.data) if res else {}
        if not updated:
            raise KeyError(f"Producto {product_id} no encontrado para actualizar")

        return updated

    async def delete_product(self, product_id: UUID) -> bool:
        """Desactiva lógicamente (soft-delete) el producto y sus variantes."""
        # Desactivar producto
        self.db.table("products").update({"is_active": False}).eq("id", str(product_id)).execute()
        # Desactivar variantes
        self.db.table("product_variants").update({"is_active": False}).eq("product_id", str(product_id)).execute()
        return True

    async def update_variant_stock(self, variant_id: UUID, new_stock: int) -> Dict[str, Any]:
        """Actualiza el stock disponible de una variante."""
        res = (
            self.db.table("product_variants")
            .update({"stock": new_stock})
            .eq("id", str(variant_id))
            .execute()
        )
        updated = _as_first_dict(res.data) if res else {}
        if not updated:
            raise KeyError(f"Variante {variant_id} no encontrada")
        return updated

    async def upload_image(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        """Sube un archivo de imagen al bucket 'products' de Supabase Storage y retorna su URL pública."""
        clean_name = re.sub(r"[^\w\.-]", "_", filename).lower()
        unique_path = f"{uuid4().hex[:10]}_{clean_name}"

        try:
            self.db.storage.from_("products").upload(
                path=unique_path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"},
            )
            public_url = self.db.storage.from_("products").get_public_url(unique_path)
            return public_url
        except Exception:
            # Fallback a URL estática si el bucket aún no está provisionado
            return f"/products/{unique_path}"
