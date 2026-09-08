from decimal import Decimal
import logging
from typing import Dict, Any, Optional
from uuid import UUID
from fastapi import HTTPException, status
from app.database import supabase
from app.config import settings
from app.models.order import CreateOrderRequest, OrderResponse, OrderStatusResponse
from app.utils.order_number import generate_order_number
from app.services.shipping_service import shipping_provider
from app.services.payment_service import PaymentService
from app.services.qstash_service import QStashService
from app.services.notification_service import NotificationService

logger = logging.getLogger("order_service")


class OrderService:
    @classmethod
    async def create_order(cls, req: CreateOrderRequest) -> Dict[str, Any]:
        """Validate variants, stock, compute shipping and totals, save to DB, and initialize MercadoPago preference."""
        # 1. Fetch variant and product details for each item
        variant_ids = [str(item.product_variant_id) for item in req.items]
        var_res = (
            supabase.table("product_variants")
            .select("*, product:products!inner(*)")
            .in_("id", variant_ids)
            .eq("is_active", True)
            .execute()
        )
        found_variants = {str(v["id"]): v for v in (var_res.data or [])}

        items_snapshot = []
        subtotal = Decimal("0.00")

        for item in req.items:
            vid = str(item.product_variant_id)
            if vid not in found_variants:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La variante de producto '{vid}' no existe o no está activa",
                )
            variant = found_variants[vid]
            product = variant["product"]

            # Stock check
            if variant["stock"] < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente para '{product['name']} ({variant['variant_name']})'. Disponibles: {variant['stock']}",
                )

            unit_price = (
                Decimal(str(variant["price_override"]))
                if variant.get("price_override") is not None
                else Decimal(str(product["base_price"]))
            )
            item_subtotal = unit_price * item.quantity
            subtotal += item_subtotal

            items_snapshot.append({
                "product_variant_id": vid,
                "product_name": product["name"],
                "variant_name": variant["variant_name"],
                "sku": variant["sku"],
                "quantity": item.quantity,
                "unit_price": unit_price,
                "subtotal": item_subtotal,
            })

        # 2. Shipping calculation
        shipping_quote = shipping_provider.calculate_cost(req.shipping_postal_code)
        shipping_cost = shipping_quote.cost
        total = subtotal + shipping_cost

        # 3. Generate unique order number
        order_number = generate_order_number()

        # 4. Insert order in Supabase
        order_insert = {
            "order_number": order_number,
            "status": "pending",
            "customer_name": req.customer_name,
            "customer_email": str(req.customer_email),
            "customer_phone": req.customer_phone,
            "shipping_address": req.shipping_address,
            "shipping_city": req.shipping_city,
            "shipping_province": req.shipping_province,
            "shipping_postal_code": req.shipping_postal_code,
            "shipping_cost": float(shipping_cost),
            "subtotal": float(subtotal),
            "total": float(total),
            "notes": req.notes,
        }

        order_res = supabase.table("orders").insert(order_insert).execute()
        created_order = order_res.data[0] if order_res.data else order_insert
        order_id = created_order.get("id")

        # 5. Insert order items
        if order_id:
            db_items = [
                {
                    "order_id": order_id,
                    "product_variant_id": it["product_variant_id"],
                    "product_name": it["product_name"],
                    "variant_name": it["variant_name"],
                    "sku": it["sku"],
                    "quantity": it["quantity"],
                    "unit_price": float(it["unit_price"]),
                    "subtotal": float(it["subtotal"]),
                }
                for it in items_snapshot
            ]
            supabase.table("order_items").insert(db_items).execute()

        # 6. MercadoPago preference
        mp_data = PaymentService.create_preference(
            order_number=order_number,
            items=items_snapshot,
            shipping_cost=shipping_cost,
            customer_name=req.customer_name,
            customer_email=str(req.customer_email),
            customer_phone=req.customer_phone,
        )

        # 7. Insert payment record
        if order_id:
            payment_insert = {
                "order_id": order_id,
                "mp_preference_id": mp_data.get("preference_id"),
                "amount": float(total),
                "mp_status": "pending",
            }
            supabase.table("payments").insert(payment_insert).execute()

        # 8. Dispatch async webhook via QStash
        webhook_target = f"{settings.backend_url}/api/webhooks/qstash/process-payment"
        await QStashService.publish_message(
            destination_url=webhook_target,
            payload={"order_number": order_number, "order_id": order_id},
        )

        created_order["items"] = items_snapshot
        created_order["init_point"] = mp_data.get("init_point")
        return created_order

    @classmethod
    def get_order_status(cls, order_number: str) -> Dict[str, Any]:
        """Fetch order status by human readable order number."""
        res = (
            supabase.table("orders")
            .select("*, order_items(count), payments(mp_status)")
            .eq("order_number", order_number)
            .limit(1)
            .execute()
        )
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido #{order_number} no encontrado",
            )

        order = res.data[0]
        items_count = len(order.get("order_items") or [])
        payments = order.get("payments") or []
        payment_status = payments[0].get("mp_status") if payments else "pending"

        return {
            "order_number": order["order_number"],
            "status": order["status"],
            "customer_name": order["customer_name"],
            "total": Decimal(str(order["total"])),
            "shipping_cost": Decimal(str(order["shipping_cost"])),
            "items_count": items_count,
            "created_at": order.get("created_at"),
            "payment_status": payment_status,
        }

    @classmethod
    def handle_payment_approved(
        cls, order_number: str, mp_payment_id: str, mp_status: str, detail: Optional[str] = None
    ) -> bool:
        """Mark order as paid, update payment record, and reduce variant stocks."""
        res = (
            supabase.table("orders")
            .select("*, order_items(*)")
            .eq("order_number", order_number)
            .limit(1)
            .execute()
        )
        if not res.data:
            logger.error(f"Order #{order_number} not found during payment webhook processing")
            return False

        order = res.data[0]
        order_id = order["id"]

        # Only process if not already paid
        if order["status"] not in ("paid", "shipped", "delivered"):
            # Update order status
            supabase.table("orders").update({"status": "paid"}).eq("id", order_id).execute()

            # Update payment record
            supabase.table("payments").update({
                "mp_payment_id": mp_payment_id,
                "mp_status": mp_status,
                "mp_status_detail": detail,
            }).eq("order_id", order_id).execute()

            # Deduct inventory stock for each variant in the order
            for item in order.get("order_items", []):
                vid = item.get("product_variant_id")
                qty = item.get("quantity", 0)
                if vid:
                    try:
                        # Fetch current stock and decrement
                        v_res = supabase.table("product_variants").select("stock").eq("id", vid).limit(1).execute()
                        if v_res.data:
                            curr_stock = v_res.data[0]["stock"]
                            new_stock = max(0, curr_stock - qty)
                            supabase.table("product_variants").update({"stock": new_stock}).eq("id", vid).execute()
                    except Exception as e:
                        logger.error(f"Error updating stock for variant {vid}: {e}")

            # Notify customer
            NotificationService.send_payment_received(order)

        return True
