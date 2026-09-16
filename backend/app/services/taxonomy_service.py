from typing import Any, Dict, List, Optional

from supabase import Client

from app.models.brand import Brand
from app.models.category import Category, Subcategory
from app.utils.cache import cached


def _as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Convierte de forma segura datos de PostgREST en una lista de diccionarios tipados."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def _as_first_dict(data: Any) -> Optional[Dict[str, Any]]:
    """Obtiene de forma segura el primer diccionario de un payload de PostgREST."""
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    if isinstance(data, dict):
        return data
    return None


class TaxonomyService:
    @staticmethod
    @cached(ttl_seconds=300, prefix="taxonomy:categories")
    def get_categories_tree(
        client: Client, brand_slug: Optional[str] = None
    ) -> List[Category]:
        """
        Obtiene el árbol de categorías activas con sus subcategorías.
        Si se especifica brand_slug, filtra únicamente aquellas categorías
        que tienen productos activos comercializados por dicha marca.
        """
        if not client:
            return []

        cat_ids_filter: Optional[List[str]] = None
        sub_ids_filter: Optional[List[str]] = None

        # Si se solicita filtrar por marca
        if brand_slug:
            brand_res = (
                client.table("brands")
                .select("id")
                .eq("slug", brand_slug)
                .execute()
            )
            brand_dict = _as_first_dict(brand_res.data)
            if not brand_dict or "id" not in brand_dict:
                return []
            brand_id = brand_dict["id"]

            # Obtener subcategorías asociadas a productos activos de esta marca
            prod_res = (
                client.table("products")
                .select("subcategory_id")
                .eq("is_active", True)
                .eq("brand_id", brand_id)
                .execute()
            )
            raw_subs = [
                str(p["subcategory_id"])
                for p in _as_dict_list(prod_res.data)
                if p.get("subcategory_id")
            ]
            sub_ids_filter = list(set(raw_subs))
            if not sub_ids_filter:
                return []

            # Obtener category_id de esas subcategorías
            sub_res = (
                client.table("subcategories")
                .select("category_id")
                .in_("id", sub_ids_filter)
                .execute()
            )
            raw_cats = [
                str(s["category_id"])
                for s in _as_dict_list(sub_res.data)
                if s.get("category_id")
            ]
            cat_ids_filter = list(set(raw_cats))
            if not cat_ids_filter:
                return []

        # 1. Obtener categorías activas (con o sin filtro)
        cat_query = client.table("categories").select("*").eq("is_active", True)
        if cat_ids_filter is not None:
            cat_query = cat_query.in_("id", cat_ids_filter)

        res_cat = cat_query.order("display_order").execute()
        categories_data = _as_dict_list(res_cat.data)

        # 2. Obtener subcategorías activas
        sub_query = client.table("subcategories").select("*").eq("is_active", True)
        if sub_ids_filter is not None:
            sub_query = sub_query.in_("id", sub_ids_filter)
        elif cat_ids_filter is not None:
            sub_query = sub_query.in_("category_id", cat_ids_filter)

        res_sub = sub_query.order("display_order").execute()
        subcategories_data = _as_dict_list(res_sub.data)

        # 3. Agrupar subcategorías por category_id
        sub_by_cat: Dict[str, List[Subcategory]] = {}
        for item in subcategories_data:
            cat_id = str(item.get("category_id", ""))
            if cat_id not in sub_by_cat:
                sub_by_cat[cat_id] = []
            sub_by_cat[cat_id].append(Subcategory.model_validate(item))

        # 4. Construir lista de categorías anidadas
        result: List[Category] = []
        for cat_item in categories_data:
            cat_id = str(cat_item.get("id", ""))
            subcats = sub_by_cat.get(cat_id, [])
            cat_payload = dict(cat_item)
            cat_payload["subcategories"] = subcats
            result.append(Category.model_validate(cat_payload))

        return result

    @staticmethod
    @cached(ttl_seconds=300, prefix="taxonomy:brands")
    def get_brands(
        client: Client,
        category_slug: Optional[str] = None,
        only_with_products: bool = False,
    ) -> List[Brand]:
        """
        Obtiene el listado de marcas comerciales activas ordenadas alfabéticamente.
        Si se especifica category_slug, filtra únicamente aquellas marcas que
        tienen productos activos en dicha categoría.
        Si only_with_products es True, filtra marcas que tengan al menos un producto activo.
        """
        if not client:
            return []

        brand_ids_filter: Optional[List[str]] = None

        # Si se solicita filtrar por categoría
        if category_slug:
            cat_res = (
                client.table("categories")
                .select("id")
                .eq("slug", category_slug)
                .execute()
            )
            cat_dict = _as_first_dict(cat_res.data)
            if not cat_dict or "id" not in cat_dict:
                return []
            cat_id = cat_dict["id"]

            # Obtener subcategorías de la categoría
            sub_res = (
                client.table("subcategories")
                .select("id")
                .eq("category_id", cat_id)
                .execute()
            )
            sub_ids = [
                str(s["id"])
                for s in _as_dict_list(sub_res.data)
                if s.get("id")
            ]
            if not sub_ids:
                return []

            # Obtener marcas que tienen productos activos en esas subcategorías
            prod_res = (
                client.table("products")
                .select("brand_id")
                .eq("is_active", True)
                .in_("subcategory_id", sub_ids)
                .execute()
            )
            raw_brands = [
                str(p["brand_id"])
                for p in _as_dict_list(prod_res.data)
                if p.get("brand_id")
            ]
            brand_ids_filter = list(set(raw_brands))
            if not brand_ids_filter:
                return []
        elif only_with_products:
            # Obtener marcas que tienen al menos un producto activo en general
            prod_res = (
                client.table("products")
                .select("brand_id")
                .eq("is_active", True)
                .execute()
            )
            raw_brands = [
                str(p["brand_id"])
                for p in _as_dict_list(prod_res.data)
                if p.get("brand_id")
            ]
            brand_ids_filter = list(set(raw_brands))
            if not brand_ids_filter:
                return []

        # Consulta final de marcas activas
        brand_query = client.table("brands").select("*").eq("is_active", True)
        if brand_ids_filter is not None:
            brand_query = brand_query.in_("id", brand_ids_filter)

        res = brand_query.order("name").execute()
        brands_data = _as_dict_list(res.data)
        return [Brand.model_validate(item) for item in brands_data]
