# Diseño Técnico — Fase 6: Checkout, MercadoPago y Webhooks (Natbell)

## 📌 Resumen Ejecutivo
Esta especificación técnica detalla la implementación integral de la **Fase 6** para el e-commerce de **Natbell**.
Abarca la creación segura de pedidos (*guest checkout* sin registro obligatorio), el cálculo inmutable de precios en backend (defensa contra manipulación de precios), la integración desacoplada con la pasarela de pagos **MercadoPago Checkout Pro** (API de Orders / Preferences) mediante el patrón *Strategy/Provider*, la confirmación asíncrona e idempotente de cobros vía Webhooks con verificación criptográfica HMAC, la actualización atómica de inventario y la interfaz de usuario en Next.js 14 con Tailwind CSS v4.

---

## 🏢 Identidad de Marca y Parámetros del Sistema
- **Nombre comercial:** Natbell
- **Tipo de negocio:** Distribuidora y tienda online de productos de belleza, peluquería, barbería y estética profesional en Argentina.
- **Moneda:** ARS (Pesos Argentinos).
- **Entorno de pagos:** Modo dual:
  - *Modo Mock/Simulación:* Activo en desarrollo o tests automatizados sin requerir tokens externos.
  - *Modo MercadoPago:* Activo cuando se configure `MERCADOPAGO_ACCESS_TOKEN` en variables de entorno.

---

## 🏛️ 1. Arquitectura del Backend y Flujo Transaccional

### 1.1 Patrón Provider Desacoplado (`app/services/payment_service.py`)
Para evitar el acoplamiento rígido con el SDK de MercadoPago y posibilitar pruebas sin fricción, se implementa una interfaz abstracta:

```python
class PaymentProvider(ABC):
    @abstractmethod
    async def create_checkout_preference(self, order: Order) -> PaymentPreferenceResult:
        """Crea la orden o preferencia de pago y retorna la URL de redirección (init_point)."""
        pass

    @abstractmethod
    async def verify_webhook_signature(self, headers: dict, raw_body: bytes) -> bool:
        """Verifica la firma criptográfica HMAC x-signature enviada por Mercado Pago."""
        pass

    @abstractmethod
    async def get_payment_status(self, payment_id: str) -> PaymentStatusResult:
        """Consulta el estado del pago en la pasarela externa."""
        pass
```

Implementaciones:
1. **`MercadoPagoProvider`**:
   - Inicializa el SDK `mercadopago` con `settings.mercadopago_access_token`.
   - Genera la orden con `items`, datos del comprador (`payer`), costos de envío y URLs de retorno (`back_urls` apuntando a `/pago/exitoso`, `/pago/pendiente`, `/pago/fallido`).
   - Retorna el `init_point` seguro provisto por Mercado Pago.
2. **`MockPaymentProvider`**:
   - Genera una URL local `http://localhost:3000/pago/simulador?order_number=ORD-YYYY-NNNNN`.
   - Permite simular el pago aprobado o rechazado en un clic durante el desarrollo.

### 1.2 Endpoints REST (`app/routers/orders.py` y `app/routers/webhooks.py`)

| Método | Endpoint | Propósito | Seguridad / Control |
|---|---|---|---|
| `POST` | `/api/orders` | Crear nueva orden de compra | Anti price-tampering, validación de stock, snapshot inmutable |
| `GET` | `/api/orders/{order_number}/status` | Consultar estado del pedido | Acceso público por número de orden (ORD-YYYY-NNNNN) |
| `POST` | `/api/webhooks/mercadopago` | Webhook de eventos de Mercado Pago | Verificación HMAC `x-signature`, idempotencia, descuento atómico de stock |
| `POST` | `/api/webhooks/mock-payment/{order_number}` | Simulación local de webhook | Solo disponible en entorno de desarrollo (`settings.phase >= 6`) |

### 1.3 Ciclo de Vida y Transición de Estados del Pedido

```
[Cliente confirma compra en /checkout]
                 │
                 ▼
          Estado: 'pending' (Orden creada, precios congelados en order_items)
                 │
                 ├───────────────────────────────┐
                 │ (Pago Aprobado)               │ (Pago Rechazado / Cancelado)
                 ▼                               ▼
          Estado: 'paid'                  Estado: 'cancelled'
    (Stock descontado atómicamente)              │
                 │                               │
                 ▼                               └─► (No afecta stock)
         Estado: 'shipped' (Admin ingresa tracking)
                 │
                 ▼
        Estado: 'delivered' (Entrega confirmada)
```

---

## 🗄️ 2. Persistencia y Modelos de Datos (Supabase / PostgreSQL)

### 2.1 Tabla `orders`
- `id` (UUID, PK)
- `order_number` (VARCHAR(20), UNIQUE) — Formato correlativo: `ORD-YYYY-NNNNN`.
- `status` (VARCHAR(20)) — Valores válidos: `pending`, `payment_pending`, `paid`, `shipped`, `delivered`, `cancelled`.
- `customer_name`, `customer_email`, `customer_phone` (Datos del comprador).
- `shipping_address`, `shipping_city`, `shipping_province`, `shipping_postal_code` (Domicilio de entrega).
- `shipping_cost` (DECIMAL(12, 2)) — Costo cotizado por zona/código postal.
- `subtotal` (DECIMAL(12, 2)) — Sumatoria oficial de items recalculada por el backend.
- `total` (DECIMAL(12, 2)) — `subtotal + shipping_cost`.
- `notes` (TEXT, nullable).
- `created_at`, `updated_at` (TIMESTAMPTZ).

### 2.2 Tabla `order_items` (Snapshots Inmutables)
- `id` (UUID, PK)
- `order_id` (UUID, FK → `orders.id`)
- `product_variant_id` (UUID, FK → `product_variants.id`, nullable on delete)
- `product_name` (VARCHAR(200)) — Snapshot del nombre al comprar.
- `variant_name` (VARCHAR(100)) — Snapshot de la variante (ej: "1000ml", "Tono 7.1").
- `sku` (VARCHAR(50)) — Snapshot del SKU.
- `quantity` (INTEGER, CHECK > 0).
- `unit_price` (DECIMAL(12, 2)) — Snapshot del precio unitario real al comprar.
- `subtotal` (DECIMAL(12, 2)) — `quantity * unit_price`.

### 2.3 Descuento Atómico de Inventario
Para prevenir sobreventas (*race conditions*), el descuento de stock se ejecuta a nivel base de datos:
```sql
UPDATE product_variants
SET stock = stock - :quantity,
    updated_at = NOW()
WHERE id = :variant_id AND stock >= :quantity;
```
Si la cantidad de filas afectadas es 0, significa que el stock se agotó entre la creación de la orden y la confirmación del pago, desencadenando una alerta transaccional para reembolso o gestión de incidencias.

---

## 💻 3. Arquitectura del Frontend (Next.js 14 App Router)

### 3.1 Estructura Modular de Componentes
```
frontend/src/
├── app/
│   ├── checkout/
│   │   └── page.js                     # Pantalla de Checkout
│   ├── pago/
│   │   ├── exitoso/page.js             # Confirmación de pago aprobado
│   │   ├── pendiente/page.js           # Pago en proceso (Rapipago/transferencia)
│   │   └── fallido/page.js             # Pago rechazado con opción de reintentar
│   └── pedido/
│       └── [orderNumber]/page.js       # Tracking público del pedido
└── components/
    └── checkout/
        ├── CustomerInfoStep.jsx        # Datos personales (nombre, email, teléfono)
        ├── ShippingAddressStep.jsx     # Domicilio + Cotizador reactivo de envío
        ├── OrderSummary.jsx            # Resumen visual con desglose de costos
        └── EmptyCheckout.jsx           # Estado vacío elegante (sin redirecciones)
```

### 3.2 Reglas de Experiencia de Usuario (UX)
1. **Sin Redirección Forzada:** Si el usuario accede a `/checkout` y el carrito está vacío, se renderiza `EmptyCheckout.jsx` con el mensaje: *"No hay productos agregados actualmente a tu compra"* y un botón de llamada a la acción para explorar el catálogo.
2. **"Comprar Ahora" Directo:** Al pulsar "Comprar ahora" desde el catálogo o ficha de producto, el usuario se transfiere inmediatamente al formulario de `/checkout` sin aperturas intermedias de drawers ni pasos innecesarios.
3. **Persistencia y Limpieza:** El store de Zustand (`useCartStore`) conserva los items hasta que la API confirma la creación exitosa del pedido (`POST /api/orders`), instante en el que se limpia el carrito de `localStorage` y se redirige a Mercado Pago.
4. **Seguimiento Visual:** `/pedido/[orderNumber]` presenta una línea de tiempo progresiva que refleja el estado real consultado a `GET /api/orders/{orderNumber}/status`.

---

## 🛡️ 4. Estrategia de Pentesting y Pruebas Obligatorias

En adhesión a las reglas de calidad y testing del proyecto:

### 4.1 Pruebas de Seguridad y Pentesting
1. **Price Tampering:** Test automatizado que envía `POST /api/orders` con precios alterados (`unit_price: 1.00`, `subtotal: 10.00`). La aserción comprueba que el backend ignore los valores del cliente y aplique los precios oficiales de la base de datos.
2. **Race Conditions / Stock Concurrency:** Test con `asyncio.gather` simulando dos compras simultáneas para la última unidad disponible (`stock: 1`). Debe procesar una sola orden y rechazar la concurrente.
3. **Webhook HMAC Spoofing:** Envío de solicitudes maliciosas a `/api/webhooks/mercadopago` sin firma `x-signature` o con firmas alteradas; el endpoint debe rechazar con `401 Unauthorized`.
4. **Anti-Replay Idempotency:** Envío reiterado (3 veces) de la misma notificación de pago aprobado; verificar que la orden permanezca `paid` y el inventario solo se descuente una vez.

### 4.2 Pruebas Unitarias y de Integración
- **Backend (`pytest`):** Validación de esquemas Pydantic `OrderCreate`, generación secuencial de `order_number`, servicios de cálculo matemático y proveedor `MockPaymentProvider`.
- **Frontend (`vitest`):** Renderizado de componentes de checkout, validación de campos obligatorios, estado de carrito vacío y cálculo dinámico de totales.

---

## 📦 5. Dependencias Requeridas
- **Backend:**
  - `mercadopago` (SDK oficial para Python)
- **Frontend:**
  - Dependencias ya instaladas y operativas (`zustand`, `@tanstack/react-query`, `lucide-react`, `@heroui/react`).
