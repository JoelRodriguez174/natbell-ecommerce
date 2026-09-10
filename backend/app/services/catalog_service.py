from decimal import Decimal
from typing import Optional, List, Any, Dict
from supabase import Client
from app.models.catalog import (
    ProductFilters,
    ProductListItem,
    ProductDetailResponse,
    PaginatedProductsResponse,
    PaginationMetadata,
)
from app.models.product import ProductVariant


class CatalogService:
    @classmethod
    def _map_to_list_item(cls, p: Dict[str, Any]) -> ProductListItem:
        """Transforma el payload relacional de PostgREST en un ProductListItem optimizado."""
        base_price = Decimal(str(p.get("base_price") or "0.00"))
        sale_price = (
            Decimal(str(p["sale_price"]))
            if p.get("sale_price") is not None
            else None
        )
        is_on_sale = bool(p.get("is_on_sale"))

        # Extraer variantes activas
        raw_variants = p.get("product_variants") or []
        active_variants = [
            v for v in raw_variants if v.get("is_active", True)
        ]

        # Calcular precios extremos (mínimo y máximo)
        active_base = sale_price if (is_on_sale and sale_price is not None) else base_price
        prices = [active_base]

        for v in active_variants:
            if v.get("price_override") is not None:
                prices.append(Decimal(str(v["price_override"])))

        min_price = min(prices)
        max_price = max(prices)

        # Determinar disponibilidad de inventario
        if active_variants:
            in_stock = any(int(v.get("stock", 0)) > 0 for v in active_variants)
        else:
            in_stock = True

        # Extraer taxonomías asociadas
        brand = p.get("brands") or {}
        subcat = p.get("subcategories") or {}
        cat = subcat.get("categories") or {}

        return ProductListItem(
            id=p["id"],
            name=p["name"],
            slug=p["slug"],
            base_price=base_price,
            sale_price=sale_price,
            is_on_sale=is_on_sale,
            is_featured=bool(p.get("is_featured", False)),
            image_urls=p.get("image_urls") or [],
            brand_name=brand.get("name"),
            brand_slug=brand.get("slug"),
            category_name=cat.get("name"),
            category_slug=cat.get("slug"),
            min_price=min_price,
            max_price=max_price,
            in_stock=in_stock,
        )

    @classmethod
    def _map_to_detail(cls, p: Dict[str, Any]) -> ProductDetailResponse:
        """Transforma el payload relacional de PostgREST en un ProductDetailResponse completo."""
        base_price = Decimal(str(p.get("base_price") or "0.00"))
        sale_price = (
            Decimal(str(p["sale_price"]))
            if p.get("sale_price") is not None
            else None
        )
        is_on_sale = bool(p.get("is_on_sale"))

        raw_variants = p.get("product_variants") or []
        active_variants = [
            v for v in raw_variants if v.get("is_active", True)
        ]

        active_base = sale_price if (is_on_sale and sale_price is not None) else base_price
        prices = [active_base]

        parsed_variants: List[ProductVariant] = []
        for v in active_variants:
            if v.get("price_override") is not None:
                prices.append(Decimal(str(v["price_override"])))
            # Validar y adaptar variante si incluye created_at
            if "created_at" in v:
                parsed_variants.append(ProductVariant.model_validate(v))

        min_price = min(prices)
        max_price = max(prices)

        if active_variants:
            in_stock = any(int(v.get("stock", 0)) > 0 for v in active_variants)
        else:
            in_stock = True

        brand = p.get("brands") or {}
        subcat = p.get("subcategories") or {}
        cat = subcat.get("categories") or {}

        return ProductDetailResponse(
            id=p["id"],
            name=p["name"],
            slug=p["slug"],
            description=p.get("description"),
            base_price=base_price,
            sale_price=sale_price,
            is_on_sale=is_on_sale,
            is_featured=bool(p.get("is_featured", False)),
            image_urls=p.get("image_urls") or [],
            brand_id=p.get("brand_id") or brand.get("id"),
            brand_name=brand.get("name"),
            brand_slug=brand.get("slug"),
            subcategory_id=p.get("subcategory_id") or subcat.get("id"),
            subcategory_name=subcat.get("name"),
            subcategory_slug=subcat.get("slug"),
            category_id=cat.get("id"),
            category_name=cat.get("name"),
            category_slug=cat.get("slug"),
            variants=parsed_variants,
            min_price=min_price,
            max_price=max_price,
            in_stock=in_stock,
        )

    @classmethod
    def get_products(
        cls, client: Client, filters: ProductFilters
    ) -> PaginatedProductsResponse:
        """Obtiene productos con filtros multicriterio y paginación defensiva."""
        if not client:
            return PaginatedProductsResponse(
                items=[],
                pagination=PaginationMetadata(
                    page=filters.page,
                    per_page=filters.per_page,
                    total_items=0,
                    total_pages=0,
                    has_next=False,
                    has_prev=False,
                ),
            )

        query = (
            client.table("products")
            .select(
                "*, brands(*), subcategories(*, categories(*)), product_variants(*)",
                count="exact",
            )
            .eq("is_active", True)
        )

        # 1. Filtro por marca
        if filters.brand:
            brand_res = (
                client.table("brands")
                .select("id")
                .eq("slug", filters.brand)
                .execute()
            )
            if brand_res.data:
                query = query.eq("brand_id", brand_res.data[0]["id"])
            else:
                return PaginatedProductsResponse(
                    items=[],
                    pagination=PaginationMetadata(
                        page=filters.page,
                        per_page=filters.per_page,
                        total_items=0,
                        total_pages=0,
                        has_next=False,
                        has_prev=False,
                    ),
                )

        # 2. Filtro por subcategoría
        if filters.subcategory:
            subcat_res = (
                client.table("subcategories")
                .select("id")
                .eq("slug", filters.subcategory)
                .execute()
            )
            if subcat_res.data:
                query = query.eq("subcategory_id", subcat_res.data[0]["id"])
            else:
                return PaginatedProductsResponse(
                    items=[],
                    pagination=PaginationMetadata(
                        page=filters.page,
                        per_page=filters.per_page,
                        total_items=0,
                        total_pages=0,
                        has_next=False,
                        has_prev=False,
                    ),
                )
        # 3. Filtro por categoría general
        elif filters.category:
            cat_res = (
                client.table("categories")
                .select("id")
                .eq("slug", filters.category)
                .execute()
            )
            if cat_res.data:
                cat_id = cat_res.data[0]["id"]
                sub_res = (
                    client.table("subcategories")
                    .select("id")
                    .eq("category_id", cat_id)
                    .execute()
                )
                sub_ids = [s["id"] for s in (sub_res.data or [])]
                if sub_ids:
                    query = query.in_("subcategory_id", sub_ids)
                else:
                    return PaginatedProductsResponse(
                        items=[],
                        pagination=PaginationMetadata(
                            page=filters.page,
                            per_page=filters.per_page,
                            total_items=0,
                            total_pages=0,
                            has_next=False,
                            has_prev=False,
                        ),
                    )
            else:
                return PaginatedProductsResponse(
                    items=[],
                    pagination=PaginationMetadata(
                        page=filters.page,
                        per_page=filters.per_page,
                        total_items=0,
                        total_pages=0,
                        has_next=False,
                        has_prev=False,
                    ),
                )

        # 4. Filtro por rango de precios
        if filters.min_price is not None:
            query = query.gte("base_price", str(filters.min_price))
        if filters.max_price is not None:
            query = query.lte("base_price", str(filters.max_price))

        # 5. Ordenamiento
        if filters.sort == "price_asc":
            query = query.order("base_price", desc=False)
        elif filters.sort == "price_desc":
            query = query.order("base_price", desc=True)
        elif filters.sort == "featured":
            query = query.order("is_featured", desc=True).order(
                "created_at", desc=True
            )
        else:
            # newest o predeterminado
            query = query.order("created_at", desc=True)

        # 6. Paginación defensiva
        offset = (filters.page - 1) * filters.per_page
        query = query.range(offset, offset + filters.per_page - 1)

        res = query.execute()
        total_items = res.count or 0
        total_pages = (
            (total_items + filters.per_page - 1) // filters.per_page
            if total_items > 0
            else 0
        )

        items = [cls._map_to_list_item(p) for p in (res.data or [])]

        return PaginatedProductsResponse(
            items=items,
            pagination=PaginationMetadata(
                page=filters.page,
                per_page=filters.per_page,
                total_items=total_items,
                total_pages=total_pages,
                has_next=filters.page < total_pages,
                has_prev=filters.page > 1,
            ),
        )

    @classmethod
    def get_product_by_slug(
        cls, client: Client, slug: str
    ) -> Optional[ProductDetailResponse]:
        """Obtiene el detalle completo de un producto por su slug con variantes."""
        if not client or not slug:
            return None

        res = (
            client.table("products")
            .select(
                "*, brands(*), subcategories(*, categories(*)), product_variants(*)"
            )
            .eq("slug", slug)
            .eq("is_active", True)
            .execute()
        )

        if not res.data:
            return None

        return cls._map_to_detail(res.data[0])

    @classmethod
    def get_featured_products(
        cls, client: Client, limit: int = 8
    ) -> List[ProductListItem]:
        """Obtiene productos destacados activos para el hero/home."""
        if not client:
            return []

        safe_limit = min(max(1, limit), 24)
        res = (
            client.table("products")
            .select(
                "*, brands(*), subcategories(*, categories(*)), product_variants(*)"
            )
            .eq("is_active", True)
            .eq("is_featured", True)
            .order("created_at", desc=True)
            .limit(safe_limit)
            .execute()
        )
        return [cls._map_to_list_item(p) for p in (res.data or [])]

    @classmethod
    def get_on_sale_products(
        cls, client: Client, limit: int = 8
    ) -> List[ProductListItem]:
        """Obtiene productos en oferta activos."""
        if not client:
            return []

        safe_limit = min(max(1, limit), 24)
        res = (
            client.table("products")
            .select(
                "*, brands(*), subcategories(*, categories(*)), product_variants(*)"
            )
            .eq("is_active", True)
            .eq("is_on_sale", True)
            .order("created_at", desc=True)
            .limit(safe_limit)
            .execute()
        )
        return [cls._map_to_list_item(p) for p in (res.data or [])]

    @classmethod
    def search_products(
        cls, client: Client, query: str, limit: int = 20
    ) -> List[ProductListItem]:
        """Búsqueda reactiva de productos por nombre o descripción."""
        if not client or not query or not query.strip():
            return []

        clean_query = query.strip()[:100]
        safe_limit = min(max(1, limit), 50)

        # Utilizar ilike para búsqueda case-insensitive
        res = (
            client.table("products")
            .select(
                "*, brands(*), subcategories(*, categories(*)), product_variants(*)"
            )
            .eq("is_active", True)
            .ilike("name", f"%{clean_query}%")
            .order("created_at", desc=True)
            .limit(safe_limit)
            .execute()
        )
        return [cls._map_to_list_item(p) for p in (res.data or [])]
