from fastapi import APIRouter, Query, HTTPException, status
from app.models.shipping import ShippingQuoteResponse
from app.services.shipping_service import shipping_provider

router = APIRouter(prefix="/api/shipping", tags=["Shipping"])


@router.get("/quote", response_model=ShippingQuoteResponse)
async def get_shipping_quote(
    postal_code: str = Query(
        ...,
        min_length=2,
        max_length=10,
        description="Código postal argentino (ej: 1425, C1425DKB, 5700)",
    )
):
    """Get shipping cost and estimated delivery time based on Argentine postal code."""
    try:
        quote = shipping_provider.calculate_cost(postal_code)
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating shipping quote: {str(e)}",
        )
