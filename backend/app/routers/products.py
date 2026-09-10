from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from supabase import Client
from app.database import get_supabase_client
from app.models.catalog import (
    ProductFilters,
    ProductListItem,
    ProductDetailResponse,
    PaginatedProductsResponse,
)
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/api/products", tags=["Productos"])


@router.get("", response_model=PaginatedProductsResponse)
async def list_products(
    filters: ProductFilters = Depends(),
    client: Client = Depends(get_supabase_client),
):
    """
    Listado paginado de productos con soporte para filtros combinables:
    - brand: slug de la marca
    - category: slug de categoría general
    - subcategory: slug de subcategoría específica
    - min_price / max_price: rango de precios
    - sort: price_asc, price_desc, newest, featured
    - page / per_page: paginación defensiva (máximo 50 por página)
    """
    return CatalogService.get_products(client, filters)


@router.get("/featured", response_model=List[ProductListItem])
async def list_featured_products(
    limit: int = Query(default=8, ge=1, le=24),
    client: Client = Depends(get_supabase_client),
):
    """
    Retorna productos destacados para la portada/hero.
    """
    return CatalogService.get_featured_products(client, limit=limit)


@router.get("/on-sale", response_model=List[ProductListItem])
async def list_on_sale_products(
    limit: int = Query(default=8, ge=1, le=24),
    client: Client = Depends(get_supabase_client),
):
    """
    Retorna productos en oferta o liquidación.
    """
    return CatalogService.get_on_sale_products(client, limit=limit)


@router.get("/search", response_model=List[ProductListItem])
async def search_products(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
    client: Client = Depends(get_supabase_client),
):
    """
    Búsqueda de productos por coincidencia de texto en título o descripción.
    """
    return CatalogService.search_products(client, query=q, limit=limit)


@router.get("/{slug}", response_model=ProductDetailResponse)
async def get_product_detail(
    slug: str = Path(..., min_length=1, max_length=220),
    client: Client = Depends(get_supabase_client),
):
    """
    Detalle completo de producto con su árbol taxonómico y variantes activas con stock.
    Retorna 404 limpio si no existe.
    """
    product = CatalogService.get_product_by_slug(client, slug=slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con slug '{slug}' no encontrado.",
        )
    return product
