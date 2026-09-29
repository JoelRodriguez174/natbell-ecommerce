import logging
import re
import unicodedata
from decimal import Decimal
from typing import Any, Dict, List, Optional

from postgrest.types import CountMethod
from supabase import Client

from app.models.catalog import (
    PaginatedProductsResponse,
    PaginationMetadata,
    ProductDetailResponse,
    ProductFilters,
    ProductListItem,
)
from app.models.product import ProductVariant
from app.utils.cache import cached
from app.utils.postgrest import as_dict_list as _as_dict_list
from app.utils.postgrest import as_first_dict as _as_first_dict

logger = logging.getLogger(__name__)


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
        raw_variants = p.get("product_variants")
        active_variants = [
            v for v in _as_dict_list(raw_variants) if v.get("is_active", True)
        ]

        # Calcular precios extremos (mínimo y máximo)
        active_base = sale_price if (is_on_sale and sale_price is not None) else base_price
        prices = [active_base]

        for v in active_variants:
            if v.get("price_override") is not None:
                prices.append(Decimal(str(v["price_override"])))

        min_price = min(prices)
        max_price = max(prices)

        # Calcular stock total de las variantes activas
        total_stock = sum(int(v.get("stock", 0) or 0) for v in active_variants)
        in_stock = total_stock > 0 if active_variants else True

        # Extraer taxonomías asociadas
        brand = p.get("brands")
        brand_dict = brand if isinstance(brand, dict) else {}

        subcat = p.get("subcategories")
        subcat_dict = subcat if isinstance(subcat, dict) else {}

        cat = subcat_dict.get("categories")
        cat_dict = cat if isinstance(cat, dict) else {}

        return ProductListItem(
            id=p["id"],
            name=p["name"],
            slug=p["slug"],
            base_price=base_price,
            sale_price=sale_price,
            is_on_sale=is_on_sale,
            is_featured=bool(p.get("is_featured", False)),
            image_urls=p.get("image_urls") or [],
            brand_name=brand_dict.get("name"),
            brand_slug=brand_dict.get("slug"),
            category_name=cat_dict.get("name"),
            category_slug=cat_dict.get("slug"),
            min_price=min_price,
            max_price=max_price,
            in_stock=in_stock,
            stock=total_stock,
            total_stock=total_stock,
            variants=active_variants,
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

        raw_variants = p.get("product_variants")
        active_variants = [
            v for v in _as_dict_list(raw_variants) if v.get("is_active", True)
        ]

        active_base = sale_price if (is_on_sale and sale_price is not None) else base_price
        prices = [active_base]

        parsed_variants: List[ProductVariant] = []
        for v in active_variants:
            if v.get("price_override") is not None:
                prices.append(Decimal(str(v["price_override"])))
            if "created_at" in v:
                parsed_variants.append(ProductVariant.model_validate(v))

        min_price = min(prices)
        max_price = max(prices)

        # Determinar disponibilidad de inventario (False si no hay variantes o todas están en 0)
        in_stock = any(int(v.get("stock", 0)) > 0 for v in active_variants)

        brand = p.get("brands")
        brand_dict = brand if isinstance(brand, dict) else {}

        subcat = p.get("subcategories")
        subcat_dict = subcat if isinstance(subcat, dict) else {}

        cat = subcat_dict.get("categories")
        cat_dict = cat if isinstance(cat, dict) else {}

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
            brand_id=p.get("brand_id") or brand_dict.get("id"),
            brand_name=brand_dict.get("name"),
            brand_slug=brand_dict.get("slug"),
            subcategory_id=p.get("subcategory_id") or subcat_dict.get("id"),
            subcategory_name=subcat_dict.get("name"),
            subcategory_slug=subcat_dict.get("slug"),
            category_id=cat_dict.get("id"),
            category_name=cat_dict.get("name"),
            category_slug=cat_dict.get("slug"),
            variants=parsed_variants,
            min_price=min_price,
            max_price=max_price,
            in_stock=in_stock,
        )

    @classmethod
    def _build_search_or_conditions(
        cls, client: Client, search_term: str
    ) -> Optional[str]:
        """
        Construye condiciones OR optimizadas y tolerantes a acentos, plurales,
        marcas y subcategorías para PostgREST.
        """
        if not search_term or not search_term.strip():
            return None

        clean = re.sub(
            r"[^\w\s\-\.]", "", search_term.strip()[:100], flags=re.UNICODE
        ).strip()
        if not clean:
            return None

        # 1. Normalizar acentos (e.g. 'argán' -> 'argan', 'máscara' -> 'mascara')
        unaccented = "".join(
            c for c in unicodedata.normalize("NFD", clean)
            if unicodedata.category(c) != "Mn"
        )

        # 2. Generar tokens únicos preservando términos originales y sin tildes
        raw_tokens = [t for t in clean.split() if len(t) >= 2] or [clean]
        norm_tokens = [t for t in unaccented.split() if len(t) >= 2] or [unaccented]

        tokens_set = set()
        for tok in raw_tokens + norm_tokens:
            tok_clean = tok.strip().lower()
            if len(tok_clean) >= 2:
                tokens_set.add(tok_clean)
                # Variante singular si termina en 's' (e.g. 'shampoos' -> 'shampoo', 'tinturas' -> 'tintura')
                if tok_clean.endswith("s") and len(tok_clean) > 3:
                    tokens_set.add(tok_clean[:-1])
                # Variante si termina en 'es' (e.g. 'acondicionadores' -> 'acondicionador')
                if tok_clean.endswith("es") and len(tok_clean) > 4:
                    tokens_set.add(tok_clean[:-2])

        tokens = list(tokens_set)[:6]
        if not tokens:
            return None

        or_conditions = []
        for t in tokens:
            or_conditions.append(f"name.ilike.%{t}%")
            or_conditions.append(f"slug.ilike.%{t}%")
            or_conditions.append(f"description.ilike.%{t}%")

        # 3. Búsqueda de marcas coincidentes
        try:
            brand_filter = ",".join(f"name.ilike.%{t}%" for t in tokens[:3])
            brand_res = client.table("brands").select("id").or_(brand_filter).limit(10).execute()
            brand_ids = [str(b["id"]) for b in _as_dict_list(brand_res.data) if "id" in b]
            if brand_ids:
                if len(brand_ids) == 1:
                    or_conditions.append(f"brand_id.eq.{brand_ids[0]}")
                else:
                    ids_str = ",".join(brand_ids)
                    or_conditions.append(f"brand_id.in.({ids_str})")
        except Exception as e:
            logger.debug("No se pudieron resolver marcas en búsqueda: %s", e)

        # 4. Búsqueda de subcategorías coincidentes
        try:
            subcat_filter = ",".join(f"name.ilike.%{t}%" for t in tokens[:3])
            subcat_res = client.table("subcategories").select("id").or_(subcat_filter).limit(10).execute()
            subcat_ids = [str(s["id"]) for s in _as_dict_list(subcat_res.data) if "id" in s]
            if subcat_ids:
                if len(subcat_ids) == 1:
                    or_conditions.append(f"subcategory_id.eq.{subcat_ids[0]}")
                else:
                    ids_str = ",".join(subcat_ids)
                    or_conditions.append(f"subcategory_id.in.({ids_str})")
        except Exception as e:
            logger.debug("No se pudieron resolver subcategorías en búsqueda: %s", e)

        return ",".join(or_conditions) if or_conditions else None

    @classmethod
    @cached(ttl_seconds=60, prefix="catalog:products")
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
                count=CountMethod.exact,
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
            brand_dict = _as_first_dict(brand_res.data)
            if brand_dict and "id" in brand_dict:
                query = query.eq("brand_id", brand_dict["id"])
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
            subcat_dict = _as_first_dict(subcat_res.data)
            if subcat_dict and "id" in subcat_dict:
                query = query.eq("subcategory_id", subcat_dict["id"])
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
            cat_dict = _as_first_dict(cat_res.data)
            if cat_dict and "id" in cat_dict:
                cat_id = cat_dict["id"]
                sub_res = (
                    client.table("subcategories")
                    .select("id")
                    .eq("category_id", cat_id)
                    .execute()
                )
                sub_rows = _as_dict_list(sub_res.data)
                sub_ids = [s["id"] for s in sub_rows if "id" in s]
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

        # 4. Filtro por productos en oferta
        if filters.on_sale is not None:
            query = query.eq("is_on_sale", filters.on_sale)

        # 5. Filtro por rango de precios
        if filters.min_price is not None:
            query = query.gte("base_price", str(filters.min_price))
        if filters.max_price is not None:
            query = query.lte("base_price", str(filters.max_price))

        # 6. Filtro por búsqueda de texto (soporta search y alias q)
        search_term = (filters.search or filters.q or "").strip()
        if search_term:
            or_conditions = cls._build_search_or_conditions(client, search_term)
            if or_conditions:
                query = query.or_(or_conditions)
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

        # 6. Ordenamiento
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

        rows = _as_dict_list(res.data)
        items = [cls._map_to_list_item(p) for p in rows]

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
    @cached(ttl_seconds=60, prefix="catalog:detail")
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

        prod_dict = _as_first_dict(res.data)
        if not prod_dict:
            return None

        return cls._map_to_detail(prod_dict)

    @classmethod
    @cached(ttl_seconds=60, prefix="catalog:featured")
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
        rows = _as_dict_list(res.data)
        return [cls._map_to_list_item(p) for p in rows]

    @classmethod
    @cached(ttl_seconds=60, prefix="catalog:on_sale")
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
        rows = _as_dict_list(res.data)
        return [cls._map_to_list_item(p) for p in rows]

    @classmethod
    @cached(ttl_seconds=30, prefix="catalog:search")
    def search_products(
        cls, client: Client, query: str, limit: int = 20
    ) -> List[ProductListItem]:
        """Búsqueda reactiva, adaptada y predictiva de productos por múltiples palabras, marcas y taxonomías."""
        if not client or not query or not query.strip():
            return []

        safe_limit = min(max(1, limit), 50)

        try:
            or_query = cls._build_search_or_conditions(client, query)
            if not or_query:
                return []

            res = (
                client.table("products")
                .select(
                    "*, brands(*), subcategories(*, categories(*)), product_variants(*)"
                )
                .eq("is_active", True)
                .or_(or_query)
                .limit(safe_limit * 2)
                .execute()
            )
            rows = _as_dict_list(res.data)
            items = [cls._map_to_list_item(p) for p in rows]

            # Filtrar productos agotados para que no aparezcan en repertorio/búsqueda
            items = [it for it in items if it.in_stock]

            # Puntuación predictiva de relevancia
            clean_query = re.sub(
                r"[^\w\s\-\.]", "", query.strip()[:100], flags=re.UNICODE
            ).strip()
            unaccented_query = "".join(
                c for c in unicodedata.normalize("NFD", clean_query)
                if unicodedata.category(c) != "Mn"
            )
            query_lower = clean_query.lower()
            unaccented_lower = unaccented_query.lower()

            tokens = [t.lower() for t in clean_query.split() if len(t) >= 2]
            norm_tokens = [t.lower() for t in unaccented_query.split() if len(t) >= 2]
            all_tokens = list(set(tokens + norm_tokens))

            def score_product(item: ProductListItem) -> int:
                score = 0
                name_l = (item.name or "").lower()
                name_norm = "".join(
                    c for c in unicodedata.normalize("NFD", name_l)
                    if unicodedata.category(c) != "Mn"
                )
                brand_l = (item.brand_name or "").lower()
                cat_l = (item.category_name or "").lower()
                slug_l = (item.slug or "").lower()

                if query_lower in name_l or unaccented_lower in name_norm:
                    score += 100
                if query_lower in brand_l or unaccented_lower in brand_l:
                    score += 70
                if query_lower in slug_l or unaccented_lower in slug_l:
                    score += 50

                for t in all_tokens:
                    if t in name_l or t in name_norm:
                        score += 30
                    if t in brand_l:
                        score += 25
                    if t in slug_l:
                        score += 20
                    if t in cat_l:
                        score += 15

                return score

            scored_items = sorted(items, key=score_product, reverse=True)
            return scored_items[:safe_limit]
        except Exception as e:
            logger.warning("Excepción defensiva capturada en búsqueda de catálogo: %s", e)
            return []
