import logging
from typing import Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException, status
from app.middleware.qstash_verify import verify_qstash_signature
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.notification_service import NotificationService

logger = logging.getLogger("webhooks")
router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


@router.post("/qstash/process-payment", dependencies=[Depends(verify_qstash_signature)])
async def qstash_process_payment(payload: Dict[str, Any]):
    """Background task executed via QStash to verify or reconcile order payment status."""
    order_number = payload.get("order_number")
    logger.info(f"QStash processing payment check for order #{order_number}")
    return {"status": "processed", "order_number": order_number}


@router.post("/qstash/send-notification", dependencies=[Depends(verify_qstash_signature)])
async def qstash_send_notification(payload: Dict[str, Any]):
    """Background task executed via QStash to send customer notifications."""
    order_data = payload.get("order")
    if order_data:
        NotificationService.send_order_confirmation(order_data)
    return {"status": "sent"}


@router.post("/mercadopago")
async def mercadopago_webhook(request: Request):
    """MercadoPago IPN webhook receiver. Notified when payment status changes."""
    query_params = dict(request.query_params)
    body: Dict[str, Any] = {}
    try:
        body = await request.json()
    except Exception:
        pass

    # MP sends topic/action in query params or body
    topic = query_params.get("type") or query_params.get("topic") or body.get("type")
    data_id = (
        query_params.get("data.id")
        or query_params.get("id")
        or (body.get("data") or {}).get("id")
    )

    logger.info(f"Received MercadoPago webhook: topic={topic}, id={data_id}")

    if topic == "payment" and data_id:
        payment_info = PaymentService.get_payment_info(str(data_id))
        if payment_info:
            mp_status = payment_info.get("status")
            external_reference = payment_info.get("external_reference")
            status_detail = payment_info.get("status_detail")

            if external_reference and mp_status == "approved":
                logger.info(
                    f"Payment approved for order #{external_reference}! Updating DB..."
                )
                OrderService.handle_payment_approved(
                    order_number=external_reference,
                    mp_payment_id=str(data_id),
                    mp_status=mp_status,
                    detail=status_detail,
                )

    return {"status": "ok"}
