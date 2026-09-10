from typing import List
from fastapi import APIRouter, Depends
from supabase import Client
from app.database import get_supabase_client
from app.models.category import Category
from app.models.brand import Brand
from app.services.taxonomy_service import TaxonomyService

router = APIRouter(prefix="/api", tags=["Taxonomías"])


@router.get("/categories", response_model=List[Category])
async def get_categories(
    client: Client = Depends(get_supabase_client),
):
    """
    Retorna el árbol jerárquico de categorías activas con sus subcategorías.
    """
    return TaxonomyService.get_categories_tree(client)


@router.get("/brands", response_model=List[Brand])
async def get_brands(
    client: Client = Depends(get_supabase_client),
):
    """
    Retorna el listado de marcas comerciales activas ordenadas alfabéticamente.
    """
    return TaxonomyService.get_brands(client)
