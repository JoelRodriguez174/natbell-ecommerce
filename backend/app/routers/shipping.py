from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.database import get_supabase_client
from app.models.shipping import ShippingQuote
from app.services.shipping_service import extract_numeric_postal_code, shipping_service

router = APIRouter(prefix="/api/shipping", tags=["Envíos y Tarifas"])


@router.get(
    "/quote",
    response_model=ShippingQuote,
    summary="Cotizar costo de envío por código postal",
    description="Calcula el costo y tiempo estimado de entrega para un código postal de Argentina (ej: 1414, C1414CAB).",
)
async def get_shipping_quote(
    postal_code: str = Query(
        ...,
        min_length=3,
        max_length=10,
        description="Código postal argentino (ej: 1414, B1602, C1002)",
        examples=["1414", "1602", "5000"],
    ),
    client: Client = Depends(get_supabase_client),
):
    try:
        # Validar formato
        extract_numeric_postal_code(postal_code)
        quote = shipping_service.quote(postal_code, db=client)
        return quote
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular la cotización de envío: {str(e)}",
        )


@router.get(
    "/zones",
    response_model=List[Dict[str, Any]],
    summary="Listar zonas y tarifas base de envío",
)
async def list_shipping_zones(
    client: Client = Depends(get_supabase_client),
):
    try:
        return shipping_service.list_zones(db=client)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener zonas de envío: {str(e)}",
        )
