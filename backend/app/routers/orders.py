from fastapi import APIRouter, HTTPException, status
from app.models.order import CreateOrderRequest, OrderResponse, OrderStatusResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(request: CreateOrderRequest):
    """Create a new order (guest checkout) and initialize MercadoPago Checkout Pro preference."""
    try:
        order = await OrderService.create_order(request)
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando la orden: {str(e)}",
        )


@router.get("/{order_number}/status", response_model=OrderStatusResponse)
async def get_order_status(order_number: str):
    """Get the current processing and payment status of an order."""
    try:
        return OrderService.get_order_status(order_number)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando el estado de la orden: {str(e)}",
        )
