from typing import List
from supabase import Client
from app.models.category import Category, Subcategory
from app.models.brand import Brand


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
        categories_data = res_cat.data or []

        # 2. Obtener subcategorías activas
        res_sub = (
            client.table("subcategories")
            .select("*")
            .eq("is_active", True)
            .order("display_order")
            .execute()
        )
        subcategories_data = res_sub.data or []

        # 3. Agrupar subcategorías por category_id
        sub_by_cat: dict[str, list[Subcategory]] = {}
        for item in subcategories_data:
            cat_id = str(item["category_id"])
            if cat_id not in sub_by_cat:
                sub_by_cat[cat_id] = []
            sub_by_cat[cat_id].append(Subcategory.model_validate(item))

        # 4. Construir lista de categorías anidadas
        result: List[Category] = []
        for cat_item in categories_data:
            cat_id = str(cat_item["id"])
            subcats = sub_by_cat.get(cat_id, [])
            cat_obj = Category(
                id=cat_item["id"],
                name=cat_item["name"],
                slug=cat_item["slug"],
                description=cat_item.get("description"),
                image_url=cat_item.get("image_url"),
                display_order=cat_item.get("display_order", 0),
                is_active=cat_item.get("is_active", True),
                created_at=cat_item["created_at"],
                subcategories=subcats,
            )
            result.append(cat_obj)

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
        brands_data = res.data or []
        return [Brand.model_validate(item) for item in brands_data]
