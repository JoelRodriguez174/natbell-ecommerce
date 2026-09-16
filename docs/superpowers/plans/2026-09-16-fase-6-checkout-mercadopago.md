# Fase 6: Checkout, MercadoPago y Webhooks — Implementation Plan (Natbell)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo completo transaccional de compra para Natbell: creación segura de pedidos (*guest checkout*), integración dual con MercadoPago Checkout Pro (Mock y Real), confirmación por Webhooks HMAC con descuento atómico de inventario, y vistas completas en Next.js 14 (`/checkout`, `/pedido/[orderNumber]`, `/pago/*`).

**Architecture:** Arquitectura limpia en capas (Routers ➔ Services ➔ Models ➔ Database). Patrón Strategy/Provider para pasarela de pago (`MockPaymentProvider` y `MercadoPagoProvider`). Protección anti price-tampering mediante cálculo oficial en backend y descuento atómico de stock en PostgreSQL con idempotencia ante reintentos de webhooks.

**Tech Stack:** FastAPI, Python 3.11+, Pydantic v2, SDK oficial `mercadopago`, Supabase (PostgreSQL), Next.js 14+ (App Router), Zustand, TanStack Query, Tailwind CSS v4, Lucide React, Pytest, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-16-fase-6-checkout-mercadopago-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/superpowers/specs/2026-09-16-fase-6-checkout-mercadopago-design.md)

## Global Constraints
- Empresa oficial: **Natbell** (prohibido utilizar "Los Arrayanes" o "Arrayanes" en interfaces, logs o código).
- Moneda: Pesos Argentinos (`ARS`).
- Modo de compra: *Guest Checkout* puro (sin autenticación obligatoria para comprar).
- Inmutabilidad de precios: El backend ignora precios enviados por el cliente; los precios unitarios se congelan en `order_items` al momento de crear la orden.
- Descuento de stock: Atómico en base de datos (`WHERE stock >= quantity`), únicamente cuando el pago es confirmado (`paid`).
- Carrito vacío en `/checkout`: Renderizar estado vacío elegante (`EmptyCheckout`), **sin redirección automática**.
- Pruebas y Pentesting obligatorios: Cada módulo debe tener cobertura de tests unitarios y tests defensivos de seguridad (price-tampering, HMAC spoofing, race condition).

---

## File Structure Map
- Backend:
  - `backend/app/config.py`: Variables de configuración de MercadoPago (`mercadopago_access_token`, `mercadopago_public_key`, `mercadopago_webhook_secret`).
  - `backend/app/utils/order_number.py`: Generador puro de código correlativo `ORD-YYYY-NNNNN`.
  - `backend/app/models/order.py`: Schemas Pydantic complementarios para creación, respuestas, tracking y pagos.
  - `backend/app/services/payment_service.py`: Interfaz `PaymentProvider`, `MockPaymentProvider` y `MercadoPagoProvider`.
  - `backend/app/services/order_service.py`: Lógica de creación de órdenes, validación de stock, cálculo de totales oficiales y persistencia en Supabase.
  - `backend/app/routers/orders.py`: Endpoints `POST /api/orders` y `GET /api/orders/{order_number}/status`.
  - `backend/app/routers/webhooks.py`: Endpoints `POST /api/webhooks/mercadopago` y `POST /api/webhooks/mock-payment/{order_number}`.
  - `backend/app/main.py`: Registro de routers `orders` y `webhooks`.
  - `backend/tests/test_order_service.py`, `backend/tests/test_payment_service.py`, `backend/tests/test_order_endpoints.py`, `backend/tests/test_order_security.py`.
- Frontend:
  - `frontend/src/components/checkout/EmptyCheckout.jsx`: Estado vacío de carrito en checkout.
  - `frontend/src/components/checkout/CustomerInfoStep.jsx`: Formulario de datos de contacto.
  - `frontend/src/components/checkout/ShippingAddressStep.jsx`: Formulario de dirección y cotizador en tiempo real.
  - `frontend/src/components/checkout/OrderSummary.jsx`: Resumen visual con subtotales, envío y total.
  - `frontend/src/app/checkout/page.js`: Vista orquestadora de checkout.
  - `frontend/src/app/pago/exitoso/page.js`, `frontend/src/app/pago/pendiente/page.js`, `frontend/src/app/pago/fallido/page.js`: Páginas de retorno de pasarela.
  - `frontend/src/app/pedido/[orderNumber]/page.js`: Seguimiento público del pedido con barra de progreso.
  - `frontend/tests/Checkout.test.jsx`, `frontend/tests/OrderTracking.test.jsx`.

---

### Task 1: Configuración de MercadoPago y Dependencias del Backend

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/.env.example`
- Test: `backend/tests/test_config_mp.py`

**Interfaces:**
- Produces: `settings.mercadopago_access_token: str`, `settings.mercadopago_public_key: str`, `settings.mercadopago_webhook_secret: str`, `settings.phase: int = 6`.

- [ ] **Step 1: Write failing test for MercadoPago settings**
Crear `backend/tests/test_config_mp.py`:
```python
def test_mercadopago_settings_loaded():
    from app.config import settings
    assert hasattr(settings, "mercadopago_access_token")
    assert hasattr(settings, "mercadopago_public_key")
    assert hasattr(settings, "mercadopago_webhook_secret")
    assert settings.phase >= 6
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_config_mp.py -v`
Expected: FAIL (AttributeError: 'Settings' object has no attribute 'mercadopago_access_token')

- [ ] **Step 3: Install mercadopago library and update config.py**
Ejecutar: `pip install mercadopago`
Modificar `backend/app/config.py`:
```python
class Settings(BaseSettings):
    app_name: str = "Natbell API"
    phase: int = 6
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # Supabase Configuration
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""

    # MercadoPago Configuration
    mercadopago_access_token: str = ""
    mercadopago_public_key: str = ""
    mercadopago_webhook_secret: str = ""
```
Actualizar `backend/.env.example`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_config_mp.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add backend/app/config.py backend/.env.example backend/tests/test_config_mp.py
git commit -m "feat(config): agregar configuracion de MercadoPago y actualizar fase a 6"
```

---

### Task 2: Utilidad de Número de Orden y Schemas de Datos Pydantic

**Files:**
- Create: `backend/app/utils/order_number.py`
- Modify: `backend/app/models/order.py`
- Test: `backend/tests/test_order_number.py`

**Interfaces:**
- Produces: `generate_order_number(sequence: int, year: Optional[int] = None) -> str`
- Produces: `OrderCreateResponse`, `OrderStatusResponse`, `PaymentPreferenceResult`

- [ ] **Step 1: Write failing test for order number generator**
Crear `backend/tests/test_order_number.py`:
```python
from app.utils.order_number import generate_order_number

def test_generate_order_number_format():
    num = generate_order_number(1, year=2026)
    assert num == "ORD-2026-00001"
    assert len(num) == 14

def test_generate_order_number_padding():
    num = generate_order_number(125, year=2026)
    assert num == "ORD-2026-00125"
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_order_number.py -v`
Expected: FAIL with ModuleNotFoundError

- [ ] **Step 3: Implement generate_order_number and update order models**
Crear `backend/app/utils/order_number.py`:
```python
from datetime import datetime
from typing import Optional

def generate_order_number(sequence: int, year: Optional[int] = None) -> str:
    if year is None:
        year = datetime.now().year
    return f"ORD-{year}-{sequence:05d}"
```
Ampliar `backend/app/models/order.py` agregando `OrderCreateResponse` (con `order_number`, `id`, `total`, `checkout_url`) y `OrderStatusResponse`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_order_number.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add backend/app/utils/order_number.py backend/app/models/order.py backend/tests/test_order_number.py
git commit -m "feat(orders): implementar generador de identificador ORD-YYYY-NNNNN y schemas de orden"
```

---

### Task 3: PaymentProvider (Estrategia Dual: Mock & MercadoPago)

**Files:**
- Create: `backend/app/services/payment_service.py`
- Test: `backend/tests/test_payment_service.py`

**Interfaces:**
- Consumes: `Order`, `OrderItem`, `settings`
- Produces: `PaymentProvider`, `MockPaymentProvider`, `MercadoPagoProvider`, `get_payment_provider()`

- [ ] **Step 1: Write failing test for PaymentProvider**
Crear `backend/tests/test_payment_service.py` testeando creación de preferencia en mock y fallback.
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_payment_service.py -v`
Expected: FAIL
- [ ] **Step 3: Implement payment_service.py**
Implementar `PaymentProvider` abstracto, `MockPaymentProvider` (genera checkout URL local simulada y valida firmas mock) y `MercadoPagoProvider` (utiliza SDK `mercadopago.SDK(access_token)` creando `preference` / `order`).
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_payment_service.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add backend/app/services/payment_service.py backend/tests/test_payment_service.py
git commit -m "feat(payments): implementar PaymentProvider con soporte dual Mock y MercadoPago"
```

---

### Task 4: OrderService (Lógica de Negocio y Anti Price-Tampering)

**Files:**
- Create: `backend/app/services/order_service.py`
- Test: `backend/tests/test_order_service.py`

**Interfaces:**
- Consumes: `OrderCreate`, `database.get_supabase_client()`, `PaymentProvider`
- Produces: `OrderService.create_order(order_data: OrderCreate) -> OrderCreateResponse`, `OrderService.get_order_status(order_number: str) -> OrderStatusResponse`

- [ ] **Step 1: Write failing test for OrderService**
Crear `backend/tests/test_order_service.py` testeando validación de stock, cálculo oficial de precios recalculando subtotales y snapshots inmutables.
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_order_service.py -v`
Expected: FAIL
- [ ] **Step 3: Implement OrderService**
Implementar `OrderService` con consulta oficial a `product_variants` y `products`, validación de inventario (`stock >= quantity`), generación de correlativo, inserción en `orders` y `order_items`, e invocación al proveedor de pago.
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_order_service.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add backend/app/services/order_service.py backend/tests/test_order_service.py
git commit -m "feat(orders): implementar OrderService con snapshot inmutable y calculo oficial de precios"
```

---

### Task 5: Router de Órdenes (`/api/orders`)

**Files:**
- Create: `backend/app/routers/orders.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_order_endpoints.py`

**Interfaces:**
- Produces: `POST /api/orders`, `GET /api/orders/{order_number}/status`

- [ ] **Step 1: Write failing test for order endpoints**
Crear `backend/tests/test_order_endpoints.py` testeando petición POST con items válidos y GET de estado.
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_order_endpoints.py -v`
Expected: FAIL (404 Not Found)
- [ ] **Step 3: Implement orders router and register in main.py**
Crear `backend/app/routers/orders.py` conectándolo con `OrderService`. Registrar en `backend/app/main.py` con prefijo `/api/orders`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_order_endpoints.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add backend/app/routers/orders.py backend/app/main.py backend/tests/test_order_endpoints.py
git commit -m "feat(api): registrar router publico de ordenes y consulta de estado"
```

---

### Task 6: Router de Webhooks, Verificación HMAC y Descuento Atómico de Stock

**Files:**
- Create: `backend/app/routers/webhooks.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_webhooks.py`, `backend/tests/test_order_security.py`

**Interfaces:**
- Produces: `POST /api/webhooks/mercadopago`, `POST /api/webhooks/mock-payment/{order_number}`

- [ ] **Step 1: Write failing tests for webhook and security**
Crear `backend/tests/test_webhooks.py` y `backend/tests/test_order_security.py`:
- Test de HMAC spoofing (rechazo de webhooks sin firma o inválidas).
- Test de idempotencia (múltiples llamadas con pago aprobado no descuentan doble stock).
- Test de price tampering (rechazo/anulación de precios alterados en el cliente).
- [ ] **Step 2: Run tests to verify they fail**
Run: `pytest backend/tests/test_webhooks.py -v`
Expected: FAIL
- [ ] **Step 3: Implement webhooks router with atomic stock discount**
Implementar verificación criptográfica `x-signature`, consulta del estado en pasarela, actualización de orden a `paid`, registro en `payments` y ejecución atómica del SQL de descuento en `product_variants`.
- [ ] **Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_webhooks.py backend/tests/test_order_security.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add backend/app/routers/webhooks.py backend/tests/test_webhooks.py backend/tests/test_order_security.py
git commit -m "feat(webhooks): implementar recepcion HMAC de MercadoPago y descuento atomico de inventario"
```

---

### Task 7: Frontend — Componentes de Checkout y Pantalla `/checkout`

**Files:**
- Create: `frontend/src/components/checkout/EmptyCheckout.jsx`
- Create: `frontend/src/components/checkout/CustomerInfoStep.jsx`
- Create: `frontend/src/components/checkout/ShippingAddressStep.jsx`
- Create: `frontend/src/components/checkout/OrderSummary.jsx`
- Create: `frontend/src/app/checkout/page.js`
- Test: `frontend/tests/Checkout.test.jsx`

**Interfaces:**
- Consumes: `useCartStore`, `shippingService` / `/api/shipping/quote`, `POST /api/orders`

- [ ] **Step 1: Write failing test for Checkout components**
Crear `frontend/tests/Checkout.test.jsx`:
- Verificar que con carrito vacío renderiza `EmptyCheckout` sin redirigir.
- Verificar que con items renderiza los pasos y el resumen de totales.
- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- tests/Checkout.test.jsx`
Expected: FAIL
- [ ] **Step 3: Implement Checkout components and page**
Construir componentes atómicos en `src/components/checkout/` con Tailwind CSS v4, tokens de diseño de Natbell, integración con el cotizador de envíos y envío de orden a la API.
- [ ] **Step 4: Run test to verify it passes**
Run: `npm test -- tests/Checkout.test.jsx`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/checkout/ frontend/src/app/checkout/ frontend/tests/Checkout.test.jsx
git commit -m "feat(checkout): implementar pantalla y componentes modulares de checkout para Natbell"
```

---

### Task 8: Frontend — Páginas de Retorno (`/pago/*`) y Seguimiento (`/pedido/[orderNumber]`)

**Files:**
- Create: `frontend/src/app/pago/exitoso/page.js`
- Create: `frontend/src/app/pago/pendiente/page.js`
- Create: `frontend/src/app/pago/fallido/page.js`
- Create: `frontend/src/app/pedido/[orderNumber]/page.js`
- Test: `frontend/tests/OrderTracking.test.jsx`

**Interfaces:**
- Consumes: `GET /api/orders/{orderNumber}/status`

- [ ] **Step 1: Write failing test for OrderTracking**
Crear `frontend/tests/OrderTracking.test.jsx` verificando renderizado de la barra de progreso (Pendiente ➔ Pagado ➔ Despachado ➔ Entregado).
- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- tests/OrderTracking.test.jsx`
Expected: FAIL
- [ ] **Step 3: Implement return and tracking pages**
Crear las páginas en `src/app/pago/` y `src/app/pedido/[orderNumber]/page.js` con diseño estético pulido, estados visuales y consumo vía TanStack Query.
- [ ] **Step 4: Run test to verify it passes**
Run: `npm test -- tests/OrderTracking.test.jsx`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add frontend/src/app/pago/ frontend/src/app/pedido/ frontend/tests/OrderTracking.test.jsx
git commit -m "feat(storefront): implementar paginas de retorno de pago y vista de seguimiento de pedido"
```

---

### Task 9: Pentesting Integral, Pruebas Concurrenciales y Cierre de Fase 6

**Files:**
- Modify: `docs/FASES_PROYECTO.md`
- Test: `backend/tests/test_concurrency_race.py`, ejecución completa de `pytest` y `vitest`

- [ ] **Step 1: Write concurrency race condition test**
Crear `backend/tests/test_concurrency_race.py` simulando con `asyncio.gather` 2 compras simultáneas para un stock de 1 unidad.
- [ ] **Step 2: Run full backend and frontend test suites**
Ejecutar `pytest` en backend (debe superar >65 tests con 100% pasando).
Ejecutar `npm test` en frontend (debe superar >45 tests con 100% pasando).
- [ ] **Step 3: Update documentation and Phase 6 status**
Actualizar `docs/FASES_PROYECTO.md` marcando la Fase 6 como Completada.
- [ ] **Step 4: Commit**
```bash
git add docs/FASES_PROYECTO.md backend/tests/test_concurrency_race.py
git commit -m "chore(release): certificar Fase 6 (Checkout, MercadoPago y Webhooks) para Natbell con suite de tests"
```
