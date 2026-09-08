from decimal import Decimal
from typing import Optional, Dict, Any, List
import math
from app.database import supabase


class ProductService:
    @staticmethod
    def get_categories() -> List[Dict[str, Any]]:
        """Fetch all active categories with their nested active subcategories."""
        response = (
            supabase.table("categories")
            .select("*, subcategories(*)")
            .eq("is_active", True)
            .order("display_order")
            .execute()
        )
        data = response.data or []
        for cat in data:
            if "subcategories" in cat and isinstance(cat["subcategories"], list):
                cat["subcategories"] = [
                    s for s in cat["subcategories"] if s.get("is_active", True)
                ]
                cat["subcategories"].sort(key=lambda s: s.get("display_order", 0))
        return data

    @staticmethod
    def get_brands() -> List[Dict[str, Any]]:
        """Fetch all active brands ordered alphabetically."""
        response = (
            supabase.table("brands")
            .select("*")
            .eq("is_active", True)
            .order("name")
            .execute()
        )
        return response.data or []

    @staticmethod
    def get_products(
        category_slug: Optional[str] = None,
        subcategory_slug: Optional[str] = None,
        brand_slug: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        q: Optional[str] = None,
        sort: Optional[str] = "newest",
        page: int = 1,
        per_page: int = 20,
    ) -> Dict[str, Any]:
        """Fetch products with multi-attribute filtering, sorting and pagination."""
        query = (
            supabase.table("products")
            .select(
                "*, brand:brands!inner(*), subcategory:subcategories!inner(*, category:categories!inner(*))",
                count="exact",
            )
            .eq("is_active", True)
        )

        if category_slug:
            query = query.eq("subcategory.category.slug", category_slug)

        if subcategory_slug:
            query = query.eq("subcategory.slug", subcategory_slug)

        if brand_slug:
            query = query.eq("brand.slug", brand_slug)

        if min_price is not None:
            query = query.gte("base_price", float(min_price))

        if max_price is not None:
            query = query.lte("base_price", float(max_price))

        if q:
            query = query.ilike("name", f"%{q}%")

        # Sorting
        if sort == "price_asc":
            query = query.order("base_price", desc=False)
        elif sort == "price_desc":
            query = query.order("base_price", desc=True)
        else:  # newest
            query = query.order("created_at", desc=True)

        # Pagination
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)

        response = query.execute()
        items = response.data or []
        total = response.count if response.count is not None else len(items)
        total_pages = math.ceil(total / per_page) if total > 0 else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_product_by_slug(slug: str) -> Optional[Dict[str, Any]]:
        """Fetch product details by slug including all active variants."""
        response = (
            supabase.table("products")
            .select("*, brand:brands(*), subcategory:subcategories(*)")
            .eq("slug", slug)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None

        product = response.data[0]
        # Fetch variants
        var_res = (
            supabase.table("product_variants")
            .select("*")
            .eq("product_id", product["id"])
            .eq("is_active", True)
            .order("created_at")
            .execute()
        )
        product["variants"] = var_res.data or []
        return product

    @staticmethod
    def get_featured_products(limit: int = 8) -> List[Dict[str, Any]]:
        """Fetch featured products for the home page."""
        response = (
            supabase.table("products")
            .select("*, brand:brands(*), subcategory:subcategories(*)")
            .eq("is_active", True)
            .eq("is_featured", True)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    @staticmethod
    def get_on_sale_products(limit: int = 8) -> List[Dict[str, Any]]:
        """Fetch discounted/on-sale products."""
        response = (
            supabase.table("products")
            .select("*, brand:brands(*), subcategory:subcategories(*)")
            .eq("is_active", True)
            .eq("is_on_sale", True)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    @staticmethod
    def search_products(q: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Quick search by product name."""
        response = (
            supabase.table("products")
            .select("*, brand:brands(*), subcategory:subcategories(*)")
            .eq("is_active", True)
            .ilike("name", f"%{q}%")
            .limit(limit)
            .execute()
        )
        return response.data or []
