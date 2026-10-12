# Especificación Técnica de Diseño: Sistema de Cupones de Descuento y Branding de Favicon

**Fecha:** 2026-10-11  
**Estado:** Propuesta Aprobada  
**Alcance:** Backend (FastAPI + Supabase DDL), Frontend (Next.js 14 + Zustand + Admin Panel), Assets (Favicon Natbell).

---

## 1. Contexto y Objetivos

El sistema de e-commerce de Natbell requiere:
1. Permitir al administrador crear, gestionar, activar/desactivar y eliminar cupones de descuento porcentuales (1% - 100%).
2. Permitir a los clientes canjear cupones válidos tanto en el Carrito de compras (`CartDrawer` / `/carrito`) como en la pantalla de `/checkout`.
3. Garantizar un cálculo seguro anti-tampering en el servidor: el backend recalcula y valida el descuento exacto sobre el subtotal de productos antes de generar la orden y la preferencia de pago en Mercado Pago.
4. Auditar en la tabla de órdenes el código de cupón utilizado y el importe bonificado.
5. Reemplazar el favicon predeterminado de Vercel/Next.js en la pestaña del navegador por el isotipo oficial de Natbell (`/img/logo-natbell.jpeg`).

---

## 2. Base de Datos y Modelo Relacional

### 2.1 Migración DDL: `database/migrations/009_coupons.sql`
```sql
-- 1. Tabla coupons
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

-- Trigger de updated_at para coupons
CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- 2. Modificaciones en la tabla orders para trazabilidad contable
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
```

---

## 3. Arquitectura de Backend (FastAPI)

### 3.1 Modelos Pydantic (`backend/app/models/coupon.py`)
- `CouponBase`:
  - `code: str` (transformado a uppercase y stripped en validator).
  - `discount_percent: int = Field(..., ge=1, le=100)`.
  - `is_active: bool = True`.
  - `max_uses: Optional[int] = Field(None, gt=0)`.
  - `expires_at: Optional[datetime] = None`.
- `CouponCreate(CouponBase)`: Datos para crear un cupón desde admin.
- `CouponUpdate(BaseModel)`: Para actualizar `is_active`, `max_uses`, `expires_at`.
- `CouponResponse(CouponBase)`: Devuelve `id: UUID`, `times_used: int`, `created_at: datetime`, `updated_at: datetime`.
- `CouponValidateRequest`: `{ code: str }`.
- `CouponValidateResponse`: `{ valid: bool, code: str, discount_percent: int }`.

### 3.2 Modificación de Modelos de Pedidos (`backend/app/models/order.py`)
- En `OrderBase`:
  - `coupon_code: Optional[str] = None`
  - `discount_amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))`
- En `OrderCheckoutRequest`:
  - `coupon_code: Optional[str] = None`

### 3.3 Servicio de Negocio (`backend/app/services/coupon_service.py`)
- `validate_coupon(code: str) -> dict`:
  1. Busca en Supabase `coupons` por `code.upper()`. Si no existe ➔ `404 Not Found: "El cupón no existe"`.
  2. Valida `is_active == True`. Si es `False` ➔ `400 Bad Request: "El cupón se encuentra inactivo"`.
  3. Valida `expires_at`. Si `expires_at < now()` ➔ `400 Bad Request: "El cupón ha expirado"`.
  4. Valida `max_uses`. Si `max_uses` no es None y `times_used >= max_uses` ➔ `400 Bad Request: "El cupón agotó su cupo de usos"`.
  5. Retorna la entidad del cupón.
- `increment_coupon_usage(coupon_id: UUID)`:
  - Incremento atómico en SQL `UPDATE coupons SET times_used = times_used + 1 WHERE id = :id`.
- Métodos CRUD Admin:
  - `list_coupons()`
  - `create_coupon(data: CouponCreate)`
  - `toggle_coupon_status(id: UUID, is_active: bool)`
  - `delete_coupon(id: UUID)`

### 3.4 Integración en `OrderService` (`backend/app/services/order_service.py`)
- Al procesar `create_order`:
  1. Si `request.coupon_code` está presente:
     - Llama a `coupon_service.validate_coupon(request.coupon_code)`.
     - Calcula `discount_amount = round(subtotal * (coupon.discount_percent / 100), 2)`.
     - Calcula `total = subtotal - discount_amount + shipping_cost`.
  2. Si no viene cupón:
     - `discount_amount = Decimal("0.00")`
     - `total = subtotal + shipping_cost`.
  3. Al insertar la orden, guarda `coupon_code` y `discount_amount`.
  4. Registra el incremento de uso en `coupon_service.increment_coupon_usage(coupon.id)`.
  5. Pasa el `total` recalculado a `PaymentService` para que el preference de Mercado Pago coincida exactamente con el precio bonificado.

### 3.5 Routers FastAPI
- `backend/app/routers/coupons.py`:
  - `POST /api/coupons/validate` (Público, Rate Limited).
- `backend/app/routers/admin_coupons.py`:
  - `GET /api/admin/coupons` (Protegido con JWT de Admin).
  - `POST /api/admin/coupons` (Protegido con JWT de Admin).
  - `PATCH /api/admin/coupons/{id}/toggle` (Protegido con JWT de Admin).
  - `DELETE /api/admin/coupons/{id}` (Protegido con JWT de Admin).

---

## 4. Arquitectura de Frontend (Next.js)

### 4.1 Favicon y Branding de Pestaña
- Actualizar `frontend/src/app/layout.js`:
  ```javascript
  export const metadata = {
    title: "Natbell — Tienda de Belleza y Peluquería Profesional",
    description: "E-commerce oficial de cosmética capilar profesional...",
    icons: {
      icon: "/img/logo-natbell.jpeg",
      shortcut: "/img/logo-natbell.jpeg",
      apple: "/img/logo-natbell.jpeg",
    },
  };
  ```
- Si existe `frontend/src/app/favicon.ico` con el logo predeterminado de Vercel/Next, reemplazarlo o eliminarlo para forzar el uso del isotipo de Natbell.

### 4.2 Zustand Cart Store (`frontend/src/store/useCartStore.js`)
- Extender el estado con:
  - `appliedCoupon: { code: string, discount_percent: number } | null`
- Métodos:
  - `applyCoupon(couponData)`
  - `removeCoupon()`
  - `getDiscountAmount()`: `round(getSubtotal() * (appliedCoupon.discount_percent / 100))`
  - `getTotalWithDiscount()`: `getSubtotal() - getDiscountAmount()`
- Persistir `appliedCoupon` en `localStorage` junto con `items`.

### 4.3 Componente Storefront `CouponInput.jsx` (`frontend/src/components/cart/CouponInput.jsx`)
- Reutilizado en `CartDrawer`, `/carrito` y `/checkout`.
- **Modo Input Libre**:
  - Campo de texto que convierte a mayúsculas en vivo.
  - Botón "Aplicar" con feedback de carga (*spinner*).
  - Mensaje de error claro en caso de cupón inválido o caducado.
- **Modo Cupón Aplicado**:
  - Badge visualmente atractivo: `🏷️ {code} — {discount_percent}% OFF`.
  - Botón `✕ Quitar` para remover el cupón.
- **Desglose de montos**:
  - Muestra la línea de descuento en color verde/rosa acentuado: `- ${discountAmount}`.

### 4.4 Panel de Administración (`frontend/src/app/admin/cupones/page.jsx`)
- **Acceso lateral**: Nuevo enlace en `frontend/src/app/admin/layout.jsx` ("Cupones", ícono de ticket).
- **Tarjetas de Estadísticas (KPIs)**:
  - Total de Cupones.
  - Cupones Activos.
  - Total de Usos Realizados.
- **Formulario de Creación con Stepper**:
  - Campo de Porcentaje con botones interactivos `[-]` y `[+]` (flechas para subir/bajar) y entrada directa numérica, limitado entre 1% y 100%.
  - Campo de código con auto-mayúsculas.
  - Límite de usos opcional.
  - Fecha de expiración opcional.
- **Tabla de Gestión**:
  - Switch rápido para activar/desactivar sin recargar (`PATCH /toggle`).
  - Progreso de usos (ej: `15 / 50` o `15 usos`).
  - Botón de eliminación con confirmación.

---

## 5. Casos Borde y Seguridad

1. **Manipulación del Cliente (Tampering)**: El cliente no puede enviar un `discount_amount` arbitrario. El servidor consulta la base de datos por el código y calcula el monto exacto.
2. **Concurrencia en Límite de Usos**: El chequeo valida `times_used < max_uses` antes de generar el pago y el contador se actualiza al crear el pedido.
3. **Mayúsculas y Espacios**: Todos los códigos se normalizan con `.strip().upper()` tanto en el frontend como en el backend.
4. **Cupón ya no válido al finalizar checkout**: Si un cupón caduca o se agota entre el momento en que se aplicó en el carrito y el clic final en pagar, el endpoint `POST /api/orders` lanzará un error 400 descriptivo y solicitará al usuario revisar su carrito.
5. **Porcentaje fuera de rango**: Validado con `ge=1, le=100` en Pydantic y en la restricción SQL `CHECK (discount_percent >= 1 AND discount_percent <= 100)`.

---

## 6. Estrategia de Pruebas

- **Backend**:
  - `tests/test_coupons.py`: Pruebas unitarias de validación (cupón inexistente, inactivo, vencido, con límite agotado y válido).
  - `tests/test_orders_with_coupon.py`: Prueba de cálculo exacto de descuento e incremento de `times_used`.
- **Frontend**:
  - Verificación de renderizado de `CouponInput`.
  - Verificación del cálculo en `useCartStore`.
  - Verificación visual de favicon en la pestaña del navegador.
- **Linters**:
  - `ruff check app tests` en Backend.
  - `npm run lint` en Frontend.
