from typing import List, Dict, Any
from supabase import Client
from app.models.category import Category, Subcategory
from app.models.brand import Brand


def _as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Convierte de forma segura datos de PostgREST en una lista de diccionarios tipados."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


class TaxonomyService:
    @staticmethod
    def get_categories_tree(client: Client) -> List[Category]:
        """
        Obtiene el árbol completo de categorías activas con sus subcategorías anidadas,
        ordenadas por display_order.
        """
        if not client:
            return []

        # 1. Obtener categorías activas
        res_cat = (
            client.table("categories")
            .select("*")
            .eq("is_active", True)
            .order("display_order")
            .execute()
        )
        categories_data = _as_dict_list(res_cat.data)

        # 2. Obtener subcategorías activas
        res_sub = (
            client.table("subcategories")
            .select("*")
            .eq("is_active", True)
            .order("display_order")
            .execute()
        )
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
    def get_brands(client: Client) -> List[Brand]:
        """
        Obtiene el listado de marcas comerciales activas ordenadas alfabéticamente.
        """
        if not client:
            return []

        res = (
            client.table("brands")
            .select("*")
            .eq("is_active", True)
            .order("name")
            .execute()
        )
        brands_data = _as_dict_list(res.data)
        return [Brand.model_validate(item) for item in brands_data]
