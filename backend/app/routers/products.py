from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.product import (
    CategoryResponse,
    BrandResponse,
    ProductResponse,
    ProductDetailResponse,
    ProductListResponse,
)
from app.services.product_service import ProductService

router = APIRouter(tags=["Products & Catalog"])


@router.get("/api/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Retrieve all active product categories with nested subcategories."""
    try:
        return ProductService.get_categories()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching categories: {str(e)}",
        )


@router.get("/api/brands", response_model=List[BrandResponse])
async def get_brands():
    """Retrieve all active brands."""
    try:
        return ProductService.get_brands()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching brands: {str(e)}",
        )


@router.get("/api/products/featured", response_model=List[ProductResponse])
async def get_featured_products(
    limit: int = Query(default=8, ge=1, le=24, description="Max products to return")
):
    """Retrieve featured products for display on homepage or landing sections."""
    try:
        return ProductService.get_featured_products(limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching featured products: {str(e)}",
        )


@router.get("/api/products/on-sale", response_model=List[ProductResponse])
async def get_on_sale_products(
    limit: int = Query(default=8, ge=1, le=24, description="Max products to return")
):
    """Retrieve on-sale / promotional discounted products."""
    try:
        return ProductService.get_on_sale_products(limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching on-sale products: {str(e)}",
        )


@router.get("/api/products/search", response_model=List[ProductResponse])
async def search_products(
    q: str = Query(..., min_length=1, description="Search term for product name"),
    limit: int = Query(default=20, ge=1, le=50),
):
    """Quick search by product name."""
    try:
        return ProductService.search_products(q=q, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching products: {str(e)}",
        )


@router.get("/api/products", response_model=ProductListResponse)
async def get_products(
    category: Optional[str] = Query(default=None, description="Category slug"),
    subcategory: Optional[str] = Query(default=None, description="Subcategory slug"),
    brand: Optional[str] = Query(default=None, description="Brand slug"),
    min_price: Optional[Decimal] = Query(default=None, ge=0, description="Minimum price"),
    max_price: Optional[Decimal] = Query(default=None, ge=0, description="Maximum price"),
    q: Optional[str] = Query(default=None, description="Search keyword"),
    sort: Optional[str] = Query(
        default="newest",
        pattern="^(newest|price_asc|price_desc)$",
        description="Sort by newest, price_asc, or price_desc",
    ),
    page: int = Query(default=1, ge=1, description="Page number"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
):
    """Get paginated list of products with multi-attribute filtering."""
    try:
        return ProductService.get_products(
            category_slug=category,
            subcategory_slug=subcategory,
            brand_slug=brand,
            min_price=min_price,
            max_price=max_price,
            q=q,
            sort=sort,
            page=page,
            per_page=per_page,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching products: {str(e)}",
        )


@router.get("/api/products/{slug}", response_model=ProductDetailResponse)
async def get_product_by_slug(slug: str):
    """Retrieve detailed product information by slug, including all variants."""
    try:
        product = ProductService.get_product_by_slug(slug=slug)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with slug '{slug}' not found",
            )
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching product '{slug}': {str(e)}",
        )
