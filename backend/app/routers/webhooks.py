import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request, status

from app.services.order_service import OrderService
from app.services.payment_service import get_payment_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


@router.post(
    "/mercadopago",
    status_code=status.HTTP_200_OK,
    summary="Webhook de notificaciones de Mercado Pago",
    description="Recibe eventos IPN / Webhook de Mercado Pago, verifica la firma criptográfica HMAC y actualiza el estado del pedido.",
)
async def mercadopago_webhook(
    request: Request,
    id: Optional[str] = None,
    topic: Optional[str] = None,
):
    provider = get_payment_provider()
    raw_body = await request.body()
    headers = dict(request.headers)

    query_data_id = request.query_params.get("data.id")

    # 1. Verificar firma criptográfica HMAC
    is_valid_signature = await provider.verify_webhook_signature(
        headers, raw_body, data_id=query_data_id
    )
    if not is_valid_signature:
        logger.warning("Rechazada notificación de webhook de Mercado Pago por firma HMAC inválida")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firma de webhook inválida.",
        )

    # 2. Parsear cuerpo de la notificación
    payload: Dict[str, Any] = {}
    if raw_body:
        try:
            payload = await request.json()
        except Exception:
            pass

    # 3. Extraer el payment_id (puede venir en data.id, query param o id directo)
    query_data_id = request.query_params.get("data.id")
    body_data_id = (payload.get("data") or {}).get("id") if isinstance(payload.get("data"), dict) else None
    payment_id = query_data_id or body_data_id or id or payload.get("id")

    # Si es evento de tipo payment o tiene ID de pago
    event_type = payload.get("type") or topic or payload.get("action")
    if payment_id and (not event_type or "payment" in str(event_type)):
        try:
            payment_details = await provider.get_payment_details(str(payment_id))
            payment_status = payment_details.get("status")
            order_number = payment_details.get("external_reference")

            if payment_status == "approved" and order_number:
                order_service = OrderService()
                await order_service.mark_order_paid(
                    order_number,
                    payment_id=str(payment_id),
                    payment_details=payment_details,
                )
                logger.info(f"Pago {payment_id} aprobado para la orden {order_number}")
        except Exception as e:
            logger.error(f"Error procesando pago {payment_id} en webhook: {e}", exc_info=True)

    return {"status": "received"}


@router.post(
    "/mock-payment/{order_number}",
    status_code=status.HTTP_200_OK,
    summary="Simulador local de confirmación de pago",
    description="Permite simular el pago aprobado para una orden en entorno de desarrollo o tests.",
)
async def mock_payment_simulation(order_number: str):
    order_service = OrderService()
    try:
        await order_service.mark_order_paid(
            order_number,
            payment_id=f"mock-pay-{order_number}",
            payment_details={"status_detail": "accredited_local"},
        )
        return {
            "status": "mock_payment_approved",
            "order_number": order_number,
            "message": f"Orden {order_number} aprobada en modo simulador.",
        }
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {order_number} no encontrada para simulación.",
        )
    except Exception as e:
        logger.error(f"Error en simulador de pago para {order_number}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al simular pago.",
        )
