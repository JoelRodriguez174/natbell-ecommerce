import logging
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.database import get_supabase_client
from app.models.order import (
    Order,
    OrderCheckoutRequest,
    OrderCreateResponse,
    OrderItem,
    OrderStatus,
    OrderStatusResponse,
)
from app.services.payment_service import PaymentProvider, get_payment_provider
from app.utils.order_number import generate_order_number, parse_order_sequence

logger = logging.getLogger(__name__)


def _as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Convierte de forma segura datos de PostgREST en una lista de diccionarios tipados."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def _as_first_dict(data: Any) -> Dict[str, Any]:
    """Obtiene de forma segura el primer diccionario de un payload relacional de PostgREST."""
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    if isinstance(data, dict):
        return data
    return {}


def _parse_datetime(val: Any) -> datetime:
    """Parsea de forma robusta strings de fecha ISO provenientes de Supabase/Postgres."""
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            pass
    return datetime.now()


class OrderService:
    """Servicio de dominio para la gestión y ciclo de vida de órdenes en Natbell."""

    def __init__(self, db_client=None, payment_provider: Optional[PaymentProvider] = None):
        self.db = db_client or get_supabase_client()
        self.payment_provider = payment_provider or get_payment_provider()

    async def create_order(self, request: OrderCheckoutRequest) -> OrderCreateResponse:
        """Crea un pedido validando stock en tiempo real y recalculando precios oficiales contra la BD."""
        if not request.items:
            raise ValueError("El pedido debe contener al menos un producto.")

        order_items_to_create = []
        calculated_subtotal = Decimal("0.00")

        # 1. Validar variantes y stock disponible en la base de datos
        for item in request.items:
            variant_res = (
                self.db.table("product_variants")
                .select("id, sku, variant_name, stock, price_override, is_active, product_id, products(name, base_price, is_active)")
                .eq("id", str(item.product_variant_id))
                .execute()
            )

            variant = _as_first_dict(variant_res.data) if variant_res else {}
            if not variant or not variant.get("id"):
                raise ValueError(f"Variante de producto con ID {item.product_variant_id} no encontrada.")

            product = _as_first_dict(variant.get("products"))

            if not variant.get("is_active", True) or not product.get("is_active", True):
                raise ValueError(f"El producto o variante {variant.get('sku')} no se encuentra disponible.")

            current_stock = int(variant.get("stock") or 0)
            if current_stock < item.quantity:
                product_name = str(product.get("name") or "Producto")
                variant_name = str(variant.get("variant_name") or "")
                raise ValueError(
                    f"Stock insuficiente para {product_name} ({variant_name}). "
                    f"Stock disponible: {current_stock}, solicitado: {item.quantity}."
                )

            # Precio oficial: si la variante tiene price_override se usa ese, sino base_price del producto
            official_price_raw = variant.get("price_override") or product.get("base_price") or 0
            unit_price = Decimal(str(official_price_raw))
            line_subtotal = unit_price * Decimal(item.quantity)
            calculated_subtotal += line_subtotal

            order_items_to_create.append(
                {
                    "product_variant_id": str(variant["id"]),
                    "product_name": str(product.get("name") or "Producto"),
                    "variant_name": str(variant.get("variant_name") or ""),
                    "sku": str(variant.get("sku") or ""),
                    "quantity": item.quantity,
                    "unit_price": float(unit_price),
                    "subtotal": float(line_subtotal),
                }
            )

        shipping_cost = Decimal(str(request.shipping_cost or "0.00"))
        if shipping_cost < Decimal("0.00"):
            raise ValueError("El costo de envío no puede ser negativo.")

        calculated_total = calculated_subtotal + shipping_cost

        # 2. Generar el número de orden correlativo ORD-YYYY-NNNNN
        next_seq = await self._get_next_order_sequence()
        order_number = generate_order_number(next_seq)

        # 3. Guardar orden en estado 'pending'
        order_insert_payload = {
            "order_number": order_number,
            "status": OrderStatus.PENDING.value,
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "customer_phone": request.customer_phone,
            "shipping_address": request.shipping_address,
            "shipping_city": request.shipping_city,
            "shipping_province": request.shipping_province,
            "shipping_postal_code": request.shipping_postal_code,
            "shipping_cost": float(shipping_cost),
            "subtotal": float(calculated_subtotal),
            "total": float(calculated_total),
            "notes": request.notes,
        }

        order_res = self.db.table("orders").insert(order_insert_payload).execute()
        created_order_data = _as_first_dict(order_res.data) if order_res else {}
        if not created_order_data or not created_order_data.get("id"):
            raise RuntimeError("Error al persistir la orden en la base de datos.")

        order_id = str(created_order_data["id"])

        # 4. Insertar snapshots inmutables en order_items
        created_order_items = []
        for line in order_items_to_create:
            line["order_id"] = order_id
            item_insert_res = self.db.table("order_items").insert(line).execute()
            first_item = _as_first_dict(item_insert_res.data) if item_insert_res else {}
            item_id = str(first_item.get("id")) if first_item.get("id") else None

            created_order_items.append(
                OrderItem(
                    id=UUID(item_id) if item_id else UUID(str(line["product_variant_id"])),
                    order_id=UUID(order_id),
                    product_variant_id=UUID(str(line["product_variant_id"])),
                    product_name=str(line["product_name"]),
                    variant_name=str(line["variant_name"]),
                    sku=str(line["sku"]),
                    quantity=int(line["quantity"]),
                    unit_price=Decimal(str(line["unit_price"])),
                    subtotal=Decimal(str(line["subtotal"])),
                )
            )

        # 5. Construir modelo de dominio Order para generar la preferencia de pago
        domain_order = Order(
            id=UUID(order_id),
            order_number=order_number,
            status=OrderStatus.PENDING,
            customer_name=request.customer_name,
            customer_email=request.customer_email,
            customer_phone=request.customer_phone,
            shipping_address=request.shipping_address,
            shipping_city=request.shipping_city,
            shipping_province=request.shipping_province,
            shipping_postal_code=request.shipping_postal_code,
            shipping_cost=shipping_cost,
            subtotal=calculated_subtotal,
            total=calculated_total,
            notes=request.notes,
            created_at=_parse_datetime(created_order_data.get("created_at")),
            updated_at=_parse_datetime(created_order_data.get("updated_at")),
            items=created_order_items,
        )

        preference_result = await self.payment_provider.create_checkout_preference(domain_order)

        return OrderCreateResponse(
            order_id=UUID(order_id),
            order_number=order_number,
            status=OrderStatus.PENDING,
            subtotal=calculated_subtotal,
            shipping_cost=shipping_cost,
            total=calculated_total,
            checkout_url=preference_result.init_point,
            mp_preference_id=preference_result.preference_id,
        )

    async def get_order_status(self, order_number: str) -> OrderStatusResponse:
        """Consulta el estado público del pedido para la pantalla /pedido/[orderNumber]."""
        order_res = (
            self.db.table("orders")
            .select("*, order_items(*)")
            .eq("order_number", order_number)
            .execute()
        )

        order_data = _as_first_dict(order_res.data) if order_res else {}
        if not order_data or not order_data.get("order_number"):
            raise KeyError(f"No se encontró el pedido con identificador {order_number}.")

        items_raw = _as_dict_list(order_data.get("order_items"))
        items = [
            OrderItem(
                id=UUID(str(it["id"])),
                order_id=UUID(str(it["order_id"])),
                product_variant_id=UUID(str(it["product_variant_id"])) if it.get("product_variant_id") else None,
                product_name=str(it.get("product_name") or ""),
                variant_name=str(it.get("variant_name") or ""),
                sku=str(it.get("sku") or ""),
                quantity=int(it.get("quantity") or 0),
                unit_price=Decimal(str(it.get("unit_price") or "0.00")),
                subtotal=Decimal(str(it.get("subtotal") or "0.00")),
            )
            for it in items_raw
        ]

        return OrderStatusResponse(
            order_number=str(order_data["order_number"]),
            status=OrderStatus(str(order_data["status"])),
            customer_name=str(order_data["customer_name"]),
            customer_email=str(order_data["customer_email"]),
            shipping_address=str(order_data["shipping_address"]),
            shipping_city=str(order_data["shipping_city"]),
            shipping_province=str(order_data["shipping_province"]),
            shipping_postal_code=str(order_data["shipping_postal_code"]),
            shipping_cost=Decimal(str(order_data.get("shipping_cost", "0.00"))),
            subtotal=Decimal(str(order_data["subtotal"])),
            total=Decimal(str(order_data["total"])),
            created_at=_parse_datetime(order_data.get("created_at")),
            items=items,
        )

    async def mark_order_paid(
        self,
        order_number: str,
        payment_id: Optional[str] = None,
        payment_details: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Actualiza el estado a 'paid', registra el pago y descuenta stock atómicamente."""
        order_res = (
            self.db.table("orders")
            .select("*, order_items(*)")
            .eq("order_number", order_number)
            .execute()
        )

        order_data = _as_first_dict(order_res.data) if order_res else {}
        if not order_data or not order_data.get("id"):
            logger.error(f"Orden {order_number} no encontrada para marcar como pagada")
            raise KeyError(f"Orden {order_number} no encontrada")

        # Idempotencia: Si ya está pagada, no volver a descontar stock ni duplicar registros
        if order_data.get("status") == OrderStatus.PAID.value:
            logger.info(f"Orden {order_number} ya se encontraba pagada (idempotencia verificada).")
            return True

        order_id = str(order_data["id"])

        # 1. Actualizar orden a 'paid'
        self.db.table("orders").update(
            {
                "status": OrderStatus.PAID.value,
                "updated_at": datetime.now().isoformat(),
            }
        ).eq("id", order_id).execute()

        # 2. Registrar en la tabla payments
        payment_insert = {
            "order_id": order_id,
            "mp_payment_id": payment_id,
            "mp_status": "approved",
            "mp_status_detail": (payment_details or {}).get("status_detail", "accredited"),
            "amount": float(Decimal(str(order_data.get("total") or 0.0))),
        }
        try:
            self.db.table("payments").insert(payment_insert).execute()
        except Exception as e:
            logger.warning(f"Aviso registrando pago en tabla payments: {e}")

        # 3. Descontar stock atómicamente de las variantes compradas
        for item in _as_dict_list(order_data.get("order_items")):
            variant_id = str(item.get("product_variant_id") or "")
            quantity = int(item.get("quantity") or 0)
            if variant_id and quantity > 0:
                self._decrement_stock(variant_id, quantity)

        logger.info(f"Orden {order_number} marcada exitosamente como 'paid' con stock actualizado.")
        return True

    def _decrement_stock(self, variant_id: str, quantity: int):
        """Resta stock de la variante de forma segura."""
        try:
            var_res = self.db.table("product_variants").select("stock").eq("id", variant_id).execute()
            var_data = _as_first_dict(var_res.data) if var_res else {}
            if var_data:
                current_stock = int(var_data.get("stock") or 0)
                new_stock = max(0, current_stock - quantity)
                self.db.table("product_variants").update(
                    {
                        "stock": new_stock,
                        "updated_at": datetime.now().isoformat(),
                    }
                ).eq("id", variant_id).execute()
        except Exception as e:
            logger.error(f"Error al descontar stock para variante {variant_id}: {e}", exc_info=True)

    async def _get_next_order_sequence(self) -> int:
        """Calcula el siguiente número correlativo para la secuencia anual de pedidos."""
        try:
            res = self.db.table("orders").select("order_number").order("created_at", desc=True).limit(1).execute()
            first_row = _as_first_dict(res.data) if res else {}
            if first_row and first_row.get("order_number"):
                last_number = str(first_row["order_number"])
                seq = parse_order_sequence(last_number)
                if seq is not None:
                    return seq + 1
        except Exception as e:
            logger.warning(f"No se pudo consultar última secuencia de orden: {e}")

        return 1

