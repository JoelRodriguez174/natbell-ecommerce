from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Response
from supabase import Client

from app.database import get_supabase_client
from app.models.brand import Brand
from app.models.category import Category
from app.services.taxonomy_service import TaxonomyService

router = APIRouter(prefix="/api", tags=["Taxonomías"])


@router.get("/categories", response_model=List[Category])
async def get_categories(
    response: Response,
    brand: Optional[str] = Query(
        default=None,
        description="Slug de la marca para filtrar categorías que tienen productos de dicha marca",
    ),
    client: Client = Depends(get_supabase_client),
):
    """
    Retorna el árbol jerárquico de categorías activas con sus subcategorías.
    Soporta filtrado condicional por marca para evitar combinaciones sin stock o erróneas.
    """
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=600"
    return TaxonomyService.get_categories_tree(client, brand_slug=brand)


@router.get("/brands", response_model=List[Brand])
async def get_brands(
    response: Response,
    category: Optional[str] = Query(
        default=None,
        description="Slug de la categoría para filtrar marcas que tienen productos en dicha categoría",
    ),
    only_with_products: bool = Query(
        default=False,
        description="Si es True, retorna únicamente marcas que tienen al menos un producto activo",
    ),
    client: Client = Depends(get_supabase_client),
):
    """
    Retorna el listado de marcas comerciales activas ordenadas alfabéticamente.
    Soporta filtrado condicional por categoría o por existencia de productos activos.
    """
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=600"
    return TaxonomyService.get_brands(
        client, category_slug=category, only_with_products=only_with_products
    )
