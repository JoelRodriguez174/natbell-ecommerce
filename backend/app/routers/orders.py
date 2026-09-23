import logging

from fastapi import APIRouter, HTTPException, status

from app.models.order import (
    OrderCheckoutRequest,
    OrderCreateResponse,
    OrderStatusResponse,
)
from app.services.order_service import OrderService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post(
    "",
    response_model=OrderCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo pedido (Guest Checkout)",
    description="Valida stock disponible, recalcula precios oficiales en backend y genera la preferencia de pago.",
)
async def create_order(request: OrderCheckoutRequest):
    service = OrderService()
    try:
        response = await service.create_order(request)
        return response
    except ValueError as e:
        logger.warning(f"Error de validación al crear orden: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error inesperado al crear orden: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al procesar el pedido. Por favor, reintente.",
        )


@router.get(
    "/{order_number}/status",
    response_model=OrderStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Consultar estado público de un pedido",
    description="Permite al comprador consultar el estado y detalle de su compra mediante su número de orden.",
)
async def get_order_status(order_number: str):
    service = OrderService()
    try:
        response = await service.get_order_status(order_number)
        return response
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_number} no encontrado.",
        )
    except Exception as e:
        logger.error(f"Error al consultar pedido {order_number}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al consultar el pedido.",
        )


@router.post(
    "/{order_number}/confirm-payment",
    status_code=status.HTTP_200_OK,
    summary="Confirmar acreditación de pago externamente con Mercado Pago",
    description="Permite que la página de retorno /pago/exitoso confirme el pedido verificando el payment_id directamente contra la API de Mercado Pago.",
)
async def confirm_order_payment(order_number: str, payment_id: str):
    service = OrderService()
    try:
        res = await service.confirm_order_payment(order_number, payment_id=payment_id)
        return res
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_number} no encontrado.",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error confirmando pago para orden {order_number}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno verificando el pago con la pasarela.",
        )


@router.delete(
    "/{order_number}",
    status_code=status.HTTP_200_OK,
    summary="Descartar un intento de compra no concretado",
    description="Elimina la orden y sus items si aún se encuentra en estado 'pending'.",
)
async def delete_draft_order(order_number: str):
    service = OrderService()
    try:
        await service.delete_draft_order(order_number)
        return {"status": "deleted", "order_number": order_number}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error(f"Error al eliminar intento de compra {order_number}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al descartar el pedido.",
        )


