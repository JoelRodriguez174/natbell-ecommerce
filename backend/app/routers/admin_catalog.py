from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from supabase import Client

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminUserResponse
from app.models.admin_catalog import (
    AdminImportSummary,
    AdminProductCreate,
    AdminProductUpdate,
    AdminStockUpdate,
    AdminUploadResponse,
    AdminVariantCreate,
)
from app.services.admin_catalog_service import AdminCatalogService
from app.services.admin_import_service import AdminImportService

router = APIRouter(prefix="/api/admin", tags=["Admin Catalog"])

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_IMPORT_EXTENSIONS = {"xlsx", "csv", "xls"}
MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


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


@router.post(
    "/products/{product_id}/variants",
    status_code=status.HTTP_201_CREATED,
    summary="Añadir una variante a un producto existente",
)
async def create_variant(
    product_id: UUID,
    payload: AdminVariantCreate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminCatalogService(db)
    try:
        return await service.create_variant(product_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear variante: {exc}",
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


@router.get(
    "/import/template",
    summary="Descargar plantilla oficial para importación masiva (XLSX o CSV)",
)
async def download_import_template(
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    _current_admin: AdminUserResponse = Depends(get_current_admin),
) -> Response:
    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if format == "xlsx"
        else "text/csv; charset=utf-8"
    )
    filename = f"plantilla_productos_natbell.{format}"
    content = AdminImportService.generate_template(format)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/import",
    response_model=AdminImportSummary,
    summary="Importar productos y variantes de forma masiva desde archivo Excel o CSV",
)
async def import_products(
    file: UploadFile = File(...),
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> AdminImportSummary:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de archivo inválido")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMPORT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido. Solo se aceptan archivos: {', '.join(ALLOWED_IMPORT_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_IMPORT_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo excede el tamaño máximo permitido de 10MB",
        )

    service = AdminImportService(db)
    try:
        return await service.import_from_bytes(file_bytes, file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error durante el procesamiento del archivo: {exc}",
        )
