from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from supabase import Client

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminUserResponse
from app.models.admin_catalog import (
    AdminProductCreate,
    AdminProductUpdate,
    AdminStockUpdate,
    AdminUploadResponse,
)
from app.services.admin_catalog_service import AdminCatalogService

router = APIRouter(prefix="/api/admin", tags=["Admin Catalog"])

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


@router.post(
    "/products",
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo producto con variantes",
)
async def create_product(
    payload: AdminProductCreate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminCatalogService(db)
    try:
        return await service.create_product(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear producto: {exc}",
        )


@router.put(
    "/products/{product_id}",
    summary="Actualizar producto del catálogo",
)
async def update_product(
    product_id: UUID,
    payload: AdminProductUpdate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminCatalogService(db)
    try:
        return await service.update_product(product_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al actualizar producto: {exc}",
        )


@router.delete(
    "/products/{product_id}",
    summary="Desactivar producto (Soft Delete)",
)
async def delete_product(
    product_id: UUID,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, str]:
    service = AdminCatalogService(db)
    await service.delete_product(product_id)
    return {"message": f"Producto {product_id} desactivado exitosamente"}


@router.patch(
    "/variants/{variant_id}/stock",
    summary="Ajustar stock de una variante",
)
async def update_variant_stock(
    variant_id: UUID,
    payload: AdminStockUpdate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminCatalogService(db)
    try:
        return await service.update_variant_stock(variant_id, payload.stock)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al actualizar stock: {exc}",
        )


@router.post(
    "/upload",
    response_model=AdminUploadResponse,
    summary="Subir imagen de producto a Supabase Storage",
)
async def upload_product_image(
    file: UploadFile = File(...),
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> AdminUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de archivo inválido")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido. Formatos aceptados: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo excede el tamaño máximo permitido de 5MB",
        )

    content_type = file.content_type or f"image/{ext}"
    service = AdminCatalogService(db)
    public_url = await service.upload_image(file_bytes, file.filename, content_type)

    return AdminUploadResponse(url=public_url, filename=file.filename)
