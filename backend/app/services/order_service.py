import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from app.config import settings
from app.database import get_supabase_client
from app.models.order import (
    Order,
    OrderCheckoutRequest,
    OrderCreateResponse,
    OrderItem,
    OrderStatus,
    OrderStatusResponse,
)
from app.services.coupon_service import CouponService
from app.services.payment_service import PaymentProvider, get_payment_provider
from app.utils.order_number import (
    ORDER_NUMBER_REGEX,
    generate_order_number,
)
from app.utils.postgrest import (
    as_dict_list as _as_dict_list,
)
from app.utils.postgrest import (
    as_first_dict as _as_first_dict,
)
from app.utils.postgrest import (
    parse_datetime as _parse_datetime,
)

logger = logging.getLogger(__name__)


def _mask_email(email: str) -> str:
    """juana.perez@gmail.com -> ju***@gmail.com"""
    local, _, domain = email.partition("@")
    return f"{local[:2]}***@{domain}" if domain else "***"


def _mask_text(text: str) -> str:
    """Av. Siempre Viva 742 -> Av. ***"""
    return f"{text.split()[0]} ***" if text.strip() else ""


ABANDONED_ORDER_HOURS = 24


def cancel_abandoned_orders(db) -> None:
    """Pasa a 'cancelled' los pedidos 'pending' con más de ABANDONED_ORDER_HOURS.

    Nunca se borran: un pago en efectivo (Rapipago/Pago Fácil) puede acreditarse días después,
    y mark_order_paid reactiva el pedido cancelado si no tenía pagos.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=ABANDONED_ORDER_HOURS)).isoformat()
    try:
        db.table("orders").update(
            {"status": OrderStatus.CANCELLED.value, "updated_at": datetime.now().isoformat()}
        ).eq("status", OrderStatus.PENDING.value).lt("created_at", cutoff).execute()
    except Exception as exc:
        logger.warning("No se pudieron cancelar órdenes abandonadas: %s", exc)


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

        # Descuento por cupón (el uso se cuenta recién al acreditarse el pago, en mark_order_paid)
        applied_coupon_code = None
        discount_amount = Decimal("0.00")

        if request.coupon_code:
            coupon = CouponService(db_client=self.db).validate_coupon(
                request.coupon_code,
                customer_email=request.customer_email,
            )
            applied_coupon_code = coupon["code"]
            discount_percent = Decimal(str(coupon.get("discount_percent") or 0))
            discount_amount = (calculated_subtotal * (discount_percent / Decimal("100"))).quantize(Decimal("0.01"))
            if discount_amount > calculated_subtotal:
                discount_amount = calculated_subtotal

        free_shipping_threshold = Decimal(str(settings.free_shipping_threshold))
        if free_shipping_threshold > Decimal("0.00") and calculated_subtotal >= free_shipping_threshold:
            shipping_cost = Decimal("0.00")
        else:
            shipping_cost = Decimal(str(request.shipping_cost or "0.00"))

        if shipping_cost < Decimal("0.00"):
            raise ValueError("El costo de envío no puede ser negativo.")

        calculated_total = calculated_subtotal - discount_amount + shipping_cost

        # 2. Generar el número de orden correlativo ORD-YYYY-NNNNN
        next_seq = await self._get_next_order_sequence()

        # 3. Guardar orden en estado 'pending'
        order_insert_payload = {
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
            "coupon_code": applied_coupon_code,
            "discount_amount": float(discount_amount),
            "notes": request.notes,
        }

        # order_number es UNIQUE en la BD: si dos compras simultáneas toman el mismo número, reintentar con el siguiente
        for attempt in range(5):
            order_number = generate_order_number(next_seq + attempt)
            order_insert_payload["order_number"] = order_number
            try:
                order_res = self.db.table("orders").insert(order_insert_payload).execute()
                break
            except Exception as e:
                if "23505" not in str(e) and "duplicate" not in str(e).lower():
                    raise
                logger.warning(f"Número de orden {order_number} ya existente, reintentando con el siguiente")
        else:
            raise RuntimeError("No se pudo asignar un número de orden único.")

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
            coupon_code=applied_coupon_code,
            discount_amount=discount_amount,
            notes=request.notes,
            created_at=_parse_datetime(created_order_data.get("created_at")),
            updated_at=_parse_datetime(created_order_data.get("updated_at")),
            items=created_order_items,
        )

        preference_result = await self.payment_provider.create_checkout_preference(domain_order)

        # Si se usan credenciales de Sandbox (TEST-) o mercadopago_sandbox está activado, redirigir a sandbox_init_point
        token = getattr(settings, "mercadopago_access_token", "")
        is_sandbox = getattr(settings, "mercadopago_sandbox", True) or token.startswith("TEST-")
        checkout_url = (
            (preference_result.sandbox_init_point or preference_result.init_point)
            if is_sandbox
            else preference_result.init_point
        )

        return OrderCreateResponse(
            order_id=UUID(order_id),
            order_number=order_number,
            status=OrderStatus.PENDING,
            subtotal=calculated_subtotal,
            shipping_cost=shipping_cost,
            total=calculated_total,
            checkout_url=checkout_url,
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

        tracking_num = str(order_data["tracking_number"]).strip() if order_data.get("tracking_number") else None
        tracking_url = f"https://www.andreani.com/#!/informacionEnvio/{tracking_num}" if tracking_num else None

        # Endpoint público y los números de orden son correlativos: no exponer datos personales completos
        return OrderStatusResponse(
            order_number=str(order_data["order_number"]),
            status=OrderStatus(str(order_data["status"])),
            customer_name=str(order_data["customer_name"]).split()[0] if order_data.get("customer_name") else "",
            customer_email=_mask_email(str(order_data["customer_email"])),
            shipping_address=_mask_text(str(order_data["shipping_address"])),
            shipping_city=str(order_data["shipping_city"]),
            shipping_province=str(order_data["shipping_province"]),
            shipping_postal_code=str(order_data["shipping_postal_code"]),
            shipping_cost=Decimal(str(order_data.get("shipping_cost", "0.00"))),
            subtotal=Decimal(str(order_data["subtotal"])),
            total=Decimal(str(order_data["total"])),
            tracking_number=tracking_num,
            tracking_url=tracking_url,
            created_at=_parse_datetime(order_data.get("created_at")),
            items=items,
        )

    async def delete_draft_order(self, order_number: str, customer_email: str) -> bool:
        """
        Elimina un intento de compra que quedó en estado 'pending' cuando el cliente
        retrocede, cancela o no concreta el pago.
        Exige el email del comprador para que nadie pueda borrar pedidos ajenos adivinando el número.
        Si la orden ya fue abonada o despachada, se rechaza la eliminación.
        """
        order_res = (
            self.db.table("orders")
            .select("id, status, customer_email")
            .eq("order_number", order_number)
            .execute()
        )
        order_data = _as_first_dict(order_res.data) if order_res else {}
        if not order_data or not order_data.get("id"):
            return True

        if str(order_data.get("customer_email") or "").strip().lower() != (customer_email or "").strip().lower():
            raise PermissionError("El email no corresponde a este pedido.")

        current_status = str(order_data.get("status"))
        if current_status != OrderStatus.PENDING.value:
            raise ValueError(
                f"No es posible descartar una orden con estado '{current_status}'. Solo se descartan órdenes pendientes no concretadas."
            )

        # Se cancela en vez de borrar: Mercado Pago permite reintentar el pago desde la misma preferencia,
        # y si el pago se acredita después, mark_order_paid reactiva el pedido
        self.db.table("orders").update(
            {"status": OrderStatus.CANCELLED.value, "updated_at": datetime.now().isoformat()}
        ).eq("id", str(order_data["id"])).eq("status", OrderStatus.PENDING.value).execute()
        logger.info(f"Intento de compra pendiente {order_number} cancelado.")
        return True

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

        # El preference de MP redondea precios por ítem: se tolera hasta $1 de diferencia
        paid_amount = (payment_details or {}).get("transaction_amount")
        order_total = Decimal(str(order_data.get("total") or 0))
        if paid_amount is not None and Decimal(str(paid_amount)) + Decimal("1.00") < order_total:
            raise ValueError(
                f"El monto pagado ({paid_amount}) no cubre el total del pedido {order_number} ({order_total})."
            )

        order_id = str(order_data["id"])

        # Un pedido cancelado por abandono (nunca tuvo pago) se reactiva: el cliente pagó tarde,
        # por ejemplo en Rapipago/Pago Fácil. Si ya tenía un pago registrado, lo canceló el admin: no se toca.
        claimable = [OrderStatus.PENDING.value]
        if order_data.get("status") == OrderStatus.CANCELLED.value and not self._has_payments(order_id):
            claimable.append(OrderStatus.CANCELLED.value)

        # 1. Pasar a 'paid' solo desde esos estados. El UPDATE condicional es atómico: si el webhook y
        # /pago/exitoso llegan a la vez (o MP repite el aviso), solo uno sigue y descuenta stock.
        claim_res = (
            self.db.table("orders")
            .update(
                {
                    "status": OrderStatus.PAID.value,
                    "updated_at": datetime.now().isoformat(),
                }
            )
            .eq("id", order_id)
            .in_("status", claimable)
            .execute()
        )
        if not _as_dict_list(getattr(claim_res, "data", None)):
            logger.info(f"Orden {order_number} ya procesada (estado: {order_data.get('status')}), sin cambios.")
            return True

        # 2. Registrar en la tabla payments
        payment_insert = {
            "order_id": order_id,
            "mp_payment_id": payment_id,
            "mp_status": "approved",
            "mp_status_detail": (payment_details or {}).get("status_detail", "accredited"),
            "amount": float(order_total),
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

        # 4. Contar el uso del cupón recién ahora, así las compras abandonadas no lo agotan
        if order_data.get("coupon_code"):
            try:
                CouponService(db_client=self.db).increment_coupon_usage(order_data["coupon_code"])
            except Exception as e:
                logger.warning(f"No se pudo incrementar el uso del cupón {order_data['coupon_code']}: {e}")

        logger.info(f"Orden {order_number} marcada exitosamente como 'paid' con stock actualizado.")
        return True

    def _has_payments(self, order_id: str) -> bool:
        res = self.db.table("payments").select("id").eq("order_id", order_id).limit(1).execute()
        return bool(_as_dict_list(getattr(res, "data", None)))

    def _decrement_stock(self, variant_id: str, quantity: int):
        """Resta stock de la variante en una sola sentencia SQL (función decrement_stock, migración 010)."""
        try:
            res = self.db.rpc(
                "decrement_stock", {"p_variant_id": variant_id, "p_quantity": quantity}
            ).execute()
            if res.data is False:
                logger.error(
                    f"SOBREVENTA: la variante {variant_id} no tenía stock para {quantity} unidades. Revisar el pedido."
                )
            return
        except Exception as e:
            # Fallback mientras la migración 010 no esté aplicada: lectura + escritura (no atómico)
            logger.warning(f"RPC decrement_stock no disponible, usando fallback: {e}")

        try:
            var_res = self.db.table("product_variants").select("stock").eq("id", variant_id).execute()
            var_data = _as_first_dict(var_res.data) if var_res else {}
            if var_data:
                current_stock = int(var_data.get("stock") or 0)
                new_stock = max(0, current_stock - quantity)
                self.db.table("product_variants").update(
                    {
                        "stock": new_stock,
                    }
                ).eq("id", variant_id).execute()
        except Exception as e:
            logger.error(f"Error al descontar stock para variante {variant_id}: {e}", exc_info=True)

    async def _get_next_order_sequence(self) -> int:
        """Calcula el siguiente número correlativo para la secuencia anual de pedidos."""
        try:
            current_year = datetime.now().year
            res = (
                self.db.table("orders")
                .select("order_number")
                .order("created_at", desc=True)
                .limit(100)
                .execute()
            )
            rows = _as_dict_list(res.data) if res else []
            max_seq = 0
            for row in rows:
                onum = str(row.get("order_number") or "")
                match = ORDER_NUMBER_REGEX.match(onum)
                if match and int(match.group(1)) == current_year:
                    seq = int(match.group(2))
                    if seq > max_seq:
                        max_seq = seq

            if max_seq > 0:
                return max_seq + 1
        except Exception as e:
            logger.warning(f"No se pudo consultar última secuencia de orden: {e}")

        return 1

    async def confirm_order_payment(self, order_number: str, payment_id: str) -> Dict[str, Any]:
        """Consulta la API oficial de Mercado Pago para verificar la acreditación del pago de una orden."""
        order_res = (
            self.db.table("orders")
            .select("id, status, order_number, total")
            .eq("order_number", order_number)
            .execute()
        )
        order_data = _as_first_dict(order_res.data) if order_res else {}
        if not order_data or not order_data.get("id"):
            raise KeyError(f"Orden {order_number} no encontrada")

        if order_data.get("status") == OrderStatus.PAID.value:
            return {
                "status": "already_paid",
                "order_number": order_number,
                "message": "La orden ya se encuentra acreditada.",
            }

        # Consultar los detalles oficiales del pago en la pasarela externa
        payment_details = await self.payment_provider.get_payment_details(payment_id)
        mp_status = payment_details.get("status")
        external_ref = payment_details.get("external_reference")

        # Seguridad estricta: Verificar que el pago esté aprobado y corresponda a este número de orden
        if mp_status != "approved":
            raise ValueError(f"El pago {payment_id} no está aprobado en Mercado Pago (estado actual: {mp_status}).")

        # Sin external_reference no hay forma de saber a qué pedido pertenece el pago: se rechaza
        if str(external_ref or "").strip() != order_number.strip():
            logger.warning(
                f"Intento de spoofing: payment {payment_id} tiene external_reference '{external_ref}', no coincide con '{order_number}'"
            )
            raise ValueError("El identificador de pago no corresponde a este pedido.")

        await self.mark_order_paid(order_number, payment_id=payment_id, payment_details=payment_details)

        return {
            "status": "approved",
            "order_number": order_number,
            "payment_id": payment_id,
            "message": f"Pago {payment_id} verificado y acreditado exitosamente.",
        }


