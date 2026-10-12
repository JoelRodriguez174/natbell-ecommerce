# Sistema de Cupones de Descuento y Branding de Favicon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un sistema completo de cupones de descuento porcentuales (1-100%) gestionables desde el panel de administración con validación segura server-side (anti-tampering), sincronizados en Carrito y Checkout, y reemplazar el favicon de Vercel por el logo oficial de Natbell.

**Architecture:** Arquitectura limpia en capas (Backend: Supabase PostgreSQL DDL ➔ Modelos Pydantic ➔ Servicios aislados ➔ Routers FastAPI con rate-limiting y auth JWT; Frontend: Zustand `useCartStore` sincronizado con `localStorage` ➔ Componente atómico `CouponInput` ➔ Pantalla `/admin/cupones` con formulario stepper y KPIs reactivos).

**Tech Stack:** Python 3.11+, FastAPI, Supabase / PostgreSQL, Pydantic v2, Pytest, Next.js 14 (App Router), React 18, Tailwind CSS v4, Zustand, Lucide React.

**Spec:** [`docs/superpowers/specs/2026-10-11-coupons-and-branding-design.md`](file:///c:/Users/Enekon/Desktop/Mis%20Proyectos/Ecommerce/docs/superpowers/specs/2026-10-11-coupons-and-branding-design.md)

## Global Constraints

- Backend Linters & Tests: `ruff check app tests` y `pytest` deben pasar con 0 errores y 0 fallos.
- Frontend Linters: `npm run lint` debe pasar sin errores.
- No se permiten dependencias externas no autorizadas.
- Todos los códigos de cupones deben normalizarse con `.strip().upper()`.
- El porcentaje de descuento debe estar estrictamente acotado entre 1 y 100.
- El cálculo monetario del descuento se realiza en el servidor sobre el subtotal de productos: `discount_amount = round(subtotal * (discount_percent / 100), 2)`. El costo de envío no recibe descuento.
- Las tareas deben ser pequeñas, atómicas y con commits individuales.

---

### Task 1: Reemplazo del Favicon y Configuración de Iconos en Root Layout

**Files:**
- Modify: `frontend/src/app/layout.js:18-24`
- Modify: `frontend/src/app/favicon.ico` (reemplazar/sobrescribir con el logo o actualizar metadatos)
- Test: Inspección de metadatos HTML

**Interfaces:**
- Consumes: `/img/logo-natbell.jpeg` existente en `frontend/public/img/logo-natbell.jpeg`
- Produces: `metadata.icons` con ruta `/img/logo-natbell.jpeg` en Next.js App Router

- [ ] **Step 1: Modificar `frontend/src/app/layout.js` para declarar los iconos oficiales en `metadata`**

```javascript
export const metadata = {
  title: "Natbell — Tienda de Belleza y Peluquería Profesional",
  description:
    "E-commerce oficial de cosmética capilar profesional, coloración, tratamientos, barbería y estética.",
  icons: {
    icon: "/img/logo-natbell.jpeg",
    shortcut: "/img/logo-natbell.jpeg",
    apple: "/img/logo-natbell.jpeg",
  },
};
```

- [ ] **Step 2: Eliminar o sincronizar el favicon predeterminado en `frontend/src/app/favicon.ico`**

Copiar `frontend/public/img/logo-natbell.jpeg` a `frontend/src/app/icon.jpeg` o eliminar el antiguo `favicon.ico` para evitar colisión de favicon estático en Next.js.

- [ ] **Step 3: Verificar compilación y linting**

Run: `npm run lint` en `frontend/`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/layout.js
git commit -m "feat(branding): set official Natbell logo as browser tab icon"
```

---

### Task 2: Migración DDL en Base de Datos para Cupones

**Files:**
- Create: `database/migrations/009_coupons.sql`
- Modify: `database/complete_setup.sql:430-433`
- Test: `backend/tests/test_migration_files.py`

**Interfaces:**
- Consumes: Esquema relacional existente (`orders` table)
- Produces: Tabla `coupons` y columnas `coupon_code`, `discount_amount` en `orders`

- [ ] **Step 1: Escribir la prueba para verificar que `009_coupons.sql` existe y tiene la sintaxis DDL correcta**

Agregar `009_coupons.sql` a `expected_migrations` en `backend/tests/test_migration_files.py`.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pytest backend/tests/test_migration_files.py -k test_migration_files_exist_and_ordered`
Expected: FAIL con "Falta el archivo de migración: 009_coupons.sql"

- [ ] **Step 3: Crear `database/migrations/009_coupons.sql` y actualizar `database/complete_setup.sql`**

```sql
-- ============================================================================
-- 009_coupons.sql
-- Tablas y columnas para sistema de cupones de descuento
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_uses INTEGER DEFAULT NULL CHECK (max_uses IS NULL OR max_uses > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `pytest backend/tests/test_migration_files.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add database/migrations/009_coupons.sql database/complete_setup.sql backend/tests/test_migration_files.py
git commit -m "feat(database): add migration 009 for coupons table and order discount fields"
```

---

### Task 3: Modelos y Schemas Pydantic para Cupones y Actualización de Órdenes

**Files:**
- Create: `backend/app/models/coupon.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/models/order.py:54-95`
- Create: `backend/tests/test_coupon_models.py`

**Interfaces:**
- Consumes: Pydantic v2 `BaseModel`, `Field`, `field_validator`
- Produces: `CouponCreate`, `CouponUpdate`, `CouponResponse`, `CouponValidateRequest`, `CouponValidateResponse`, `Order.coupon_code`, `Order.discount_amount`

- [ ] **Step 1: Escribir tests unitarios que verifiquen validación de esquemas**

Crear `backend/tests/test_coupon_models.py`:
- `test_coupon_code_uppercase_normalization()`: código `"verano10 "` se convierte a `"VERANO10"`.
- `test_coupon_discount_percent_bounds()`: porcentaje 0 falla, 101 falla, 15 pasa.
- `test_order_checkout_request_optional_coupon()`: acepta `coupon_code="VERANO10"` o `None`.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pytest backend/tests/test_coupon_models.py`
Expected: FAIL con `ModuleNotFoundError: No module named 'app.models.coupon'`

- [ ] **Step 3: Implementar `backend/app/models/coupon.py` y actualizar `backend/app/models/order.py`**

```python
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_percent: int = Field(..., ge=1, le=100)
    is_active: bool = True
    max_uses: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("El código de cupón no puede estar vacío.")
        return clean


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    is_active: Optional[bool] = None
    max_uses: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None


class CouponResponse(CouponBase):
    id: UUID
    times_used: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        return v.strip().upper()


class CouponValidateResponse(BaseModel):
    valid: bool = True
    code: str
    discount_percent: int
```

En `backend/app/models/order.py`:
- En `OrderBase`: agregar `coupon_code: Optional[str] = None` y `discount_amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))`.
- En `OrderCheckoutRequest`: agregar `coupon_code: Optional[str] = None`.

- [ ] **Step 4: Ejecutar tests y ruff para verificar que pasan**

Run: `pytest backend/tests/test_coupon_models.py` y `ruff check app tests`
Expected: PASS y All checks passed!

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/coupon.py backend/app/models/__init__.py backend/app/models/order.py backend/tests/test_coupon_models.py
git commit -m "feat(backend): implement pydantic schemas for coupons and extend order models"
```

---

### Task 4: Servicio de Cupones (`CouponService`) y Pruebas Unitarias

**Files:**
- Create: `backend/app/services/coupon_service.py`
- Create: `backend/tests/test_coupon_service.py`

**Interfaces:**
- Consumes: Supabase client en `app.database`, esquemas en `app.models.coupon`
- Produces: `CouponService.validate_coupon()`, `CouponService.list_coupons()`, `CouponService.create_coupon()`, `CouponService.toggle_status()`, `CouponService.delete_coupon()`, `CouponService.increment_usage()`

- [ ] **Step 1: Escribir tests unitarios para `CouponService` con mocks de DB**

Crear `backend/tests/test_coupon_service.py` testeando:
- Cupón válido devuelve diccionario con porcentaje.
- Cupón no encontrado levanta `HTTPException(404)`.
- Cupón `is_active=False` levanta `HTTPException(400)`.
- Cupón con `expires_at` vencido levanta `HTTPException(400)`.
- Cupón con `times_used >= max_uses` levanta `HTTPException(400)`.
- `increment_coupon_usage()` ejecuta query SQL o RPC de incremento.

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pytest backend/tests/test_coupon_service.py`
Expected: FAIL con `ModuleNotFoundError: No module named 'app.services.coupon_service'`

- [ ] **Step 3: Implementar `backend/app/services/coupon_service.py`**

Incluir:
- `validate_coupon(code: str) -> dict`
- `list_coupons() -> list`
- `create_coupon(data: CouponCreate) -> dict`
- `toggle_status(coupon_id: str, is_active: bool) -> dict`
- `delete_coupon(coupon_id: str) -> bool`
- `increment_coupon_usage(coupon_id: str) -> None`

- [ ] **Step 4: Ejecutar tests y ruff**

Run: `pytest backend/tests/test_coupon_service.py` y `ruff check app tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/coupon_service.py backend/tests/test_coupon_service.py
git commit -m "feat(backend): implement CouponService with full validation and usage tracking"
```

---

### Task 5: Endpoints FastAPI (Público y Admin) e Integración con `OrderService`

**Files:**
- Create: `backend/app/routers/coupons.py`
- Create: `backend/app/routers/admin_coupons.py`
- Modify: `backend/app/services/order_service.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_coupons_api.py`

**Interfaces:**
- Consumes: `CouponService`, `get_current_admin` auth dependency
- Produces: `POST /api/coupons/validate`, `GET /api/admin/coupons`, `POST /api/admin/coupons`, `PATCH /api/admin/coupons/{id}/toggle`, `DELETE /api/admin/coupons/{id}`, cálculo de orden con descuento.

- [ ] **Step 1: Escribir tests de integración de API para cupones y órdenes con cupón**

Crear `backend/tests/test_coupons_api.py`:
- `test_validate_coupon_endpoint_success()`
- `test_validate_coupon_endpoint_invalid()`
- `test_admin_coupons_crud_authorized()`
- `test_create_order_applies_coupon_and_recalculates_total()`

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pytest backend/tests/test_coupons_api.py`
Expected: FAIL (endpoints no registrados)

- [ ] **Step 3: Implementar routers y actualizar `order_service.py` y `main.py`**

- `backend/app/routers/coupons.py` implementa `POST /validate`.
- `backend/app/routers/admin_coupons.py` implementa endpoints protegidos con `Depends(get_current_admin)`.
- `backend/app/services/order_service.py`: si `payload.coupon_code` está presente, valida con `coupon_service.validate_coupon()`, calcula `discount_amount = round(subtotal * (coupon["discount_percent"] / Decimal(100)), 2)`, recalcula `total = subtotal - discount_amount + shipping_cost`, persiste `coupon_code` y `discount_amount`, e incrementa uso con `coupon_service.increment_coupon_usage()`.
- Registrar ambos routers en `backend/app/main.py`.

- [ ] **Step 4: Ejecutar tests y ruff**

Run: `pytest backend/tests/test_coupons_api.py` y `ruff check app tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/coupons.py backend/app/routers/admin_coupons.py backend/app/services/order_service.py backend/app/main.py backend/tests/test_coupons_api.py
git commit -m "feat(backend): expose coupons public & admin routers and integrate with order calculation"
```

---

### Task 6: Frontend — Extensión de `useCartStore` y Componente `CouponInput`

**Files:**
- Modify: `frontend/src/store/useCartStore.js`
- Create: `frontend/src/components/cart/CouponInput.jsx`
- Modify: `frontend/src/components/cart/CartDrawer.jsx`
- Modify: `frontend/src/app/carrito/page.js`
- Modify: `frontend/src/app/checkout/page.js`

**Interfaces:**
- Consumes: API `POST /api/coupons/validate`
- Produces: `useCartStore.appliedCoupon`, `useCartStore.applyCoupon()`, `useCartStore.removeCoupon()`, `useCartStore.getDiscountAmount()`, `CouponInput` renderizable en Carrito y Checkout.

- [ ] **Step 1: Extender `useCartStore.js` con soporte para cupones**

Agregar en el store:
- `appliedCoupon: null`
- `applyCoupon: (coupon) => set({ appliedCoupon: coupon })`
- `removeCoupon: () => set({ appliedCoupon: null })`
- `getDiscountAmount: () => { const sub = get().getSubtotal(); const c = get().appliedCoupon; if (!c || !c.discount_percent) return 0; return Math.round(sub * (c.discount_percent / 100)); }`
- Actualizar `partialize` para guardar `{ items: state.items, appliedCoupon: state.appliedCoupon }`.

- [ ] **Step 2: Crear el componente atómico `frontend/src/components/cart/CouponInput.jsx`**

- Modo entrada: input de texto que transforma a mayúsculas, botón "Aplicar", spinner de carga con Lucide `Loader2`, mensaje de error si la API retorna 400/404.
- Modo aplicado: tarjeta con icono de ticket (`Ticket` o `Tag`), texto `"{code} — {discount_percent}% OFF"`, botón `✕ Quitar`.

- [ ] **Step 3: Integrar `CouponInput` y desglose de precio en `CartDrawer.jsx` y `carrito/page.js`**

Mostrar:
- Subtotal: `$XX.XXX`
- **Descuento ({discount_percent}%): `-$XX.XXX`** (texto en verde/rosado)
- Total: `$XX.XXX`

- [ ] **Step 4: Integrar `CouponInput` y payload en `checkout/page.js`**

- Incluir `CouponInput` en el resumen del checkout.
- Enviar `coupon_code: appliedCoupon?.code || null` en la llamada a `createOrder`.
- Si el backend devuelve error de cupón al crear orden, mostrar mensaje toast o alert invitando a revisar el carrito.

- [ ] **Step 5: Verificar linting de frontend**

Run: `npm run lint` en `frontend/`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/store/useCartStore.js frontend/src/components/cart/CouponInput.jsx frontend/src/components/cart/CartDrawer.jsx frontend/src/app/carrito/page.js frontend/src/app/checkout/page.js
git commit -m "feat(frontend): integrate coupon state, CouponInput component and checkout payload"
```

---

### Task 7: Frontend — Panel de Administración de Cupones (`/admin/cupones`)

**Files:**
- Modify: `frontend/src/app/admin/layout.jsx` (agregar enlace a Cupones)
- Create: `frontend/src/app/admin/cupones/page.jsx`

**Interfaces:**
- Consumes: API `/api/admin/coupons`, token JWT de `useAdminAuthStore`
- Produces: Página interactiva `/admin/cupones` con KPIs, modal de creación con stepper `[-]`/`[+]`, toggle switch de estado y eliminación.

- [ ] **Step 1: Agregar navegación en `frontend/src/app/admin/layout.jsx`**

Agregar `{ name: "Cupones", href: "/admin/cupones", icon: Ticket }` en el menú de navegación del layout administrativo.

- [ ] **Step 2: Crear la página `frontend/src/app/admin/cupones/page.jsx`**

Implementar:
1. **Cards de Resumen (KPIs)**: Total cupones, Cupones activos, Total usos.
2. **Botón "Nuevo Cupón"**: Abre modal de creación.
3. **Modal de Creación con Stepper**:
   - Código en mayúsculas (`code`).
   - Control de porcentaje (`discount_percent`): Botones interactivos `[-]` y `[+]` para subir/bajar de 1% a 100% o escribir directamente el valor numérico.
   - Límite de usos (`max_uses`) opcional.
   - Fecha de vencimiento (`expires_at`) opcional.
4. **Tabla de Cupones**:
   - Código, porcentaje, estado (switch toggle rápido que llama a `PATCH /api/admin/coupons/{id}/toggle`), contador de usos (`times_used / max_uses`), fecha de vencimiento y botón de eliminar con modal de confirmación.

- [ ] **Step 3: Verificar linting de frontend**

Run: `npm run lint` en `frontend/`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/admin/layout.jsx frontend/src/app/admin/cupones/page.jsx
git commit -m "feat(admin): create coupons management dashboard with stepper percent control"
```

---

### Task 8: Verificación Integral, Suite de Pruebas y Quality Gate

**Files:**
- Test: Todas las suites de pruebas backend y linters frontend/backend.

- [ ] **Step 1: Ejecutar la suite completa de tests de Backend**

Run: `pytest -v` en `backend/`
Expected: 100% de tests passing

- [ ] **Step 2: Ejecutar linter de Backend**

Run: `ruff check app tests` en `backend/`
Expected: All checks passed!

- [ ] **Step 3: Ejecutar linter de Frontend**

Run: `npm run lint` en `frontend/`
Expected: 0 errors

- [ ] **Step 4: Ejecutar script de aprobación de Code Review**

Run: `python scripts/approve_code_review.py`
Expected: Certificación aprobada

- [ ] **Step 5: Commit final de verificación si aplica**

```bash
git commit -m "chore: complete coupon feature verification and pass quality gates" --allow-empty
```
