# E-commerce de Productos de Belleza y Peluquería — Design Spec

## Resumen

E-commerce para **Los Arrayanes** — distribuidora de productos de belleza, peluquería, barbería, estética y accesorios profesionales en Argentina. ~650+ productos de ~25 marcas organizados en 11 categorías. Los clientes compran como invitados (sin crear cuenta), completando un formulario con datos de envío y pagando mediante MercadoPago Checkout Pro. Incluye panel de administración completo.

## Stack Tecnológico

| Componente | Tecnología | Deploy |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS v4 | Vercel |
| Backend | FastAPI + Python 3.11+ | Render |
| Base de datos | Supabase (PostgreSQL) | Supabase Cloud |
| Pagos | MercadoPago Checkout Pro (SDK Python) | — |
| Broker | QStash / Upstash Workflow (Python SDK) | Upstash Cloud |
| Envío fase 1 | Tarifas fijas por zona (admin configurable) | — |
| Envío fase 2 | API Andreani (cuando se obtengan credenciales) | — |
| Almacenamiento de imágenes | Supabase Storage | Supabase Cloud |

## Moneda y Mercado

- **País:** Argentina
- **Moneda:** ARS (Peso Argentino)
- **Idioma:** Español

## Catálogo Real (Los Arrayanes)

### Marcas principales (15)

Nov, Plasma, La Puissance, Playcolor, Frilayp, Beauty Color, Yilho, Emynent, Escudo, Mac Gregor, Lash, Eurostyl, Jessamy, X5, Roubaix

### Marcas secundarias (~10, presentes en categorías de máquinas/accesorios)

Duga, Kemei, Wahl, Royal Cut, Mozku, Everest, Geo 2000, Dorco, Treet, Nova, Scher, Kiepe, Andis

### Categorías y Subcategorías (11 categorías, ~35 subcategorías)

**1. Coloración** → Tinturas, Decoloración, Oxidantes, Matizadores, Accesorios de Coloración
**2. Tratamientos Capilares** → Máscaras/Baños de Crema, Ampollas/Restauradores, Alisados/Cauterizado, Cremas de Peinar, Serums/Aceites
**3. Shampoos y Acondicionadores** → Shampoos, Acondicionadores/Bálsamos
**4. Styling / Fijación** → Geles, Ceras/Pomadas, Fijadores/Spray, Protectores Térmicos
**5. Barbería** → Aceites y Bálsamos para Barba, Afeitado, Navajas y Filos, Limpia Máquinas
**6. Máquinas y Herramientas Eléctricas** → Secadores, Planchas, Patilleras/Máquinas de Corte, Bucleadoras, Tornos y Cabinas (Uñas), Tijeras
**7. Accesorios de Peluquería** → Peines, Cepillos, Bigudíes y Ruleros, Broches y Sujetadores, Bowls y Recipientes, Rociadores
**8. Pestañas y Cejas** → Pestañas Postizas, Laminado y Lifting, Tintura de Pestañas
**9. Descartables e Higiene** → Guantes, Gorros y Capas, Toallas, Cubrecamillas, Vendas y Depilación
**10. Uñas y Manicuría** → Limas, Moldes, Alicates y Cortantes, Accesorios de Uñas, Quitaesmalte
**11. Ondulación** → Lociones de Ondulación

> **Nota:** Los códigos de archivo (ej: `40061`) son códigos internos de referencia que se usarán como base para generar los SKU. Muchos productos son la misma fórmula en diferentes tamaños (240ml, 1900ml, 3900ml) y se modelan como variantes.

---

## 1. Modelado de Base de Datos

### 1.1 `categories`

Categorías principales de productos.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL |
| `slug` | VARCHAR(120) | NOT NULL, UNIQUE |
| `description` | TEXT | NULLABLE |
| `image_url` | TEXT | NULLABLE |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 1.2 `subcategories`

Subcategorías dentro de cada categoría.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `category_id` | UUID | FK → categories(id), NOT NULL |
| `name` | VARCHAR(100) | NOT NULL |
| `slug` | VARCHAR(120) | NOT NULL, UNIQUE |
| `description` | TEXT | NULLABLE |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 1.3 `brands`

Marcas de productos.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL |
| `slug` | VARCHAR(120) | NOT NULL, UNIQUE |
| `logo_url` | TEXT | NULLABLE |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 1.4 `products`

Producto base (sin variantes).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `subcategory_id` | UUID | FK → subcategories(id), NOT NULL |
| `brand_id` | UUID | FK → brands(id), NOT NULL |
| `name` | VARCHAR(200) | NOT NULL |
| `slug` | VARCHAR(220) | NOT NULL, UNIQUE |
| `description` | TEXT | NULLABLE |
| `base_price` | DECIMAL(12,2) | NOT NULL, CHECK > 0 |
| `is_featured` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| `is_on_sale` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| `sale_price` | DECIMAL(12,2) | NULLABLE, CHECK > 0 when not null |
| `image_urls` | JSONB | NOT NULL, DEFAULT '[]' |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Índices:** `idx_products_subcategory` on (subcategory_id), `idx_products_brand` on (brand_id), `idx_products_slug` on (slug), `idx_products_featured` on (is_featured) WHERE is_active = TRUE.

### 1.5 `product_variants`

Variantes de cada producto (tamaño, tono, etc.).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `product_id` | UUID | FK → products(id), NOT NULL |
| `sku` | VARCHAR(50) | NOT NULL, UNIQUE |
| `variant_name` | VARCHAR(100) | NOT NULL (ej: "100ml", "7.1 Rubio Ceniza") |
| `price_override` | DECIMAL(12,2) | NULLABLE (si null, usa product.base_price) |
| `stock` | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Índices:** `idx_variants_product` on (product_id), `idx_variants_sku` on (sku).

### 1.6 `orders`

Pedidos de compra (guest checkout, sin cuenta de usuario).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `order_number` | VARCHAR(20) | NOT NULL, UNIQUE (formato: ORD-YYYY-NNNNN) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' |
| `customer_name` | VARCHAR(150) | NOT NULL |
| `customer_email` | VARCHAR(254) | NOT NULL |
| `customer_phone` | VARCHAR(30) | NOT NULL |
| `shipping_address` | VARCHAR(300) | NOT NULL |
| `shipping_city` | VARCHAR(100) | NOT NULL |
| `shipping_province` | VARCHAR(100) | NOT NULL |
| `shipping_postal_code` | VARCHAR(10) | NOT NULL |
| `shipping_cost` | DECIMAL(12,2) | NOT NULL |
| `subtotal` | DECIMAL(12,2) | NOT NULL |
| `total` | DECIMAL(12,2) | NOT NULL |
| `notes` | TEXT | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Status enum values:** `pending`, `payment_pending`, `paid`, `shipped`, `delivered`, `cancelled`.

**Índices:** `idx_orders_status` on (status), `idx_orders_number` on (order_number), `idx_orders_email` on (customer_email).

### 1.7 `order_items`

Líneas de cada pedido (snapshots de datos al momento de la compra).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `order_id` | UUID | FK → orders(id), NOT NULL |
| `product_variant_id` | UUID | FK → product_variants(id), NULLABLE (SET NULL on delete) |
| `product_name` | VARCHAR(200) | NOT NULL (snapshot) |
| `variant_name` | VARCHAR(100) | NOT NULL (snapshot) |
| `sku` | VARCHAR(50) | NOT NULL (snapshot) |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 |
| `unit_price` | DECIMAL(12,2) | NOT NULL (snapshot) |
| `subtotal` | DECIMAL(12,2) | NOT NULL |

### 1.8 `payments`

Registro de pago de MercadoPago vinculado a una orden.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `order_id` | UUID | FK → orders(id), NOT NULL, UNIQUE |
| `mp_preference_id` | VARCHAR(100) | NULLABLE |
| `mp_payment_id` | VARCHAR(100) | NULLABLE |
| `mp_status` | VARCHAR(50) | NULLABLE |
| `mp_status_detail` | VARCHAR(100) | NULLABLE |
| `amount` | DECIMAL(12,2) | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 1.9 `shipping_zones`

Zonas de envío con tarifas fijas configurables por el admin.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `zone_name` | VARCHAR(100) | NOT NULL |
| `postal_code_ranges` | JSONB | NOT NULL (ej: [{"from":"1000","to":"1499"}]) |
| `cost` | DECIMAL(12,2) | NOT NULL, CHECK >= 0 |
| `estimated_days` | INTEGER | NOT NULL, CHECK > 0 |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 1.10 `admin_users`

Usuarios administradores (1-2 usuarios con credenciales fijas).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() |
| `email` | VARCHAR(254) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `name` | VARCHAR(100) | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Diagrama de relaciones

```
categories 1──N subcategories 1──N products N──1 brands
                                       │
                                       1
                                       │
                                       N
                                 product_variants
                                       │
                                       N
                                       │
                                  order_items N──1 orders 1──1 payments
                                                     │
                                              shipping_zones (lookup por CP)
```

---

## 2. Arquitectura del Backend (FastAPI)

### 2.1 Estructura de directorios

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, CORS, lifespan
│   ├── config.py                  # Settings (Pydantic BaseSettings, env vars)
│   ├── database.py                # Supabase client init
│   ├── models/                    # Pydantic schemas (request/response)
│   │   ├── product.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── shipping.py
│   │   └── admin.py
│   ├── routers/                   # Endpoints agrupados por dominio
│   │   ├── products.py            # Catálogo público
│   │   ├── orders.py              # Crear/consultar órdenes
│   │   ├── payments.py            # MercadoPago
│   │   ├── shipping.py            # Cotización de envío
│   │   ├── webhooks.py            # QStash + MercadoPago IPN
│   │   └── admin/
│   │       ├── auth.py
│   │       ├── products.py
│   │       ├── orders.py
│   │       ├── shipping_zones.py
│   │       └── dashboard.py
│   ├── services/                  # Lógica de negocio
│   │   ├── product_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py     # MercadoPago SDK
│   │   ├── shipping_service.py    # ShippingProvider interface
│   │   ├── notification_service.py
│   │   └── qstash_service.py
│   ├── middleware/
│   │   ├── admin_auth.py          # JWT verification
│   │   └── qstash_verify.py       # QStash signature verification
│   └── utils/
│       ├── slug.py
│       └── order_number.py
├── requirements.txt
├── .env
└── Dockerfile
```

### 2.2 Endpoints públicos

**Productos:**
- `GET /api/products` — listado paginado con filtros (?category, ?subcategory, ?brand, ?min_price, ?max_price, ?q, ?sort, ?page, ?per_page)
- `GET /api/products/{slug}` — detalle + variantes
- `GET /api/products/featured` — productos destacados
- `GET /api/products/on-sale` — productos en oferta
- `GET /api/products/search?q=` — búsqueda por nombre/marca
- `GET /api/categories` — categorías con subcategorías anidadas
- `GET /api/brands` — listado de marcas

**Órdenes:**
- `POST /api/orders` — crear orden (datos cliente + items del carrito)
- `GET /api/orders/{order_number}/status` — consultar estado del pedido

**Envío:**
- `GET /api/shipping/quote?postal_code=XXXX` — cotizar envío por código postal

### 2.3 Webhooks

- `POST /api/webhooks/qstash/process-payment` — QStash invoca para crear preferencia de MercadoPago
- `POST /api/webhooks/qstash/send-notification` — QStash invoca para enviar email de confirmación
- `POST /api/webhooks/mercadopago` — MercadoPago IPN notifica cambio de estado del pago

### 2.4 Endpoints admin (protegidos con JWT)

**Auth:**
- `POST /api/admin/auth/login` — login → JWT
- `GET /api/admin/auth/me` — info del admin logueado

**Productos CRUD:**
- `GET /api/admin/products` — listar todos (incluye inactivos)
- `POST /api/admin/products` — crear producto + variantes
- `PUT /api/admin/products/{id}` — editar producto
- `DELETE /api/admin/products/{id}` — soft delete (is_active=false)
- `POST /api/admin/products/{id}/variants` — agregar variante
- `PUT /api/admin/products/{id}/variants/{vid}` — editar variante/stock

**Pedidos:**
- `GET /api/admin/orders` — listar con filtros por estado
- `GET /api/admin/orders/{id}` — detalle completo
- `PATCH /api/admin/orders/{id}/status` — cambiar estado

**Zonas de envío:**
- `GET /api/admin/shipping-zones` — listar
- `POST /api/admin/shipping-zones` — crear
- `PUT /api/admin/shipping-zones/{id}` — editar
- `DELETE /api/admin/shipping-zones/{id}` — eliminar

**Dashboard:**
- `GET /api/admin/dashboard/stats` — ventas del día/semana/mes, pedidos pendientes, stock bajo

### 2.5 Flujo de compra completo

1. Cliente navega catálogo, agrega productos al carrito (localStorage)
2. Va al checkout, completa datos personales + dirección + CP
3. Frontend cotiza envío (`GET /api/shipping/quote?postal_code=XXXX`)
4. Cliente confirma → Frontend envía `POST /api/orders`
5. Backend valida datos, verifica stock, calcula totales, guarda orden (status: `pending`)
6. Backend publica mensaje en QStash → `process-payment`
7. QStash invoca webhook → Backend crea preferencia en MercadoPago → actualiza orden (status: `payment_pending`)
8. Backend retorna `mp_checkout_url` al frontend
9. Frontend redirige al cliente a MercadoPago
10. Cliente paga en MercadoPago
11. MercadoPago envía IPN webhook → Backend verifica pago, actualiza orden (status: `paid`), descuenta stock
12. Backend publica mensaje en QStash → `send-notification`
13. QStash invoca webhook → Backend envía email de confirmación al comprador
14. Cliente vuelve al sitio (back_url) → ve página de estado del pedido

### 2.6 Shipping Provider (patrón Strategy)

```python
class ShippingProvider(ABC):
    @abstractmethod
    async def get_quote(self, postal_code: str) -> ShippingQuote: ...

    @abstractmethod
    async def create_shipment(self, order: Order) -> Shipment: ...

    @abstractmethod
    async def get_tracking(self, tracking_code: str) -> TrackingInfo: ...

class FixedRateProvider(ShippingProvider):
    """Fase 1: busca en shipping_zones por postal_code_ranges"""

class AndreaniProvider(ShippingProvider):
    """Fase 2: consume API de Andreani para cotización real"""
```

---

## 3. Arquitectura del Frontend (Next.js + Tailwind v4)

### 3.1 Estructura de directorios

```
frontend/
├── src/
│   ├── app/                           # App Router
│   │   ├── layout.js                  # Layout raíz
│   │   ├── page.js                    # Home
│   │   ├── globals.css                # Tailwind v4 + custom tokens
│   │   ├── productos/
│   │   │   ├── page.js               # Catálogo con filtros
│   │   │   └── [slug]/page.js        # Detalle de producto
│   │   ├── categoria/
│   │   │   ├── [slug]/page.js        # Por categoría
│   │   │   └── [slug]/[sub]/page.js  # Por subcategoría
│   │   ├── marca/[slug]/page.js      # Por marca
│   │   ├── carrito/page.js           # Carrito
│   │   ├── checkout/page.js          # Checkout
│   │   ├── pedido/[orderNumber]/page.js # Estado post-compra
│   │   ├── pago/
│   │   │   ├── exitoso/page.js       # MP success
│   │   │   ├── pendiente/page.js     # MP pending
│   │   │   └── fallido/page.js       # MP failure
│   │   └── admin/                    # Panel admin
│   │       ├── layout.js             # Admin layout + auth guard
│   │       ├── page.js               # Dashboard
│   │       ├── login/page.js
│   │       ├── productos/...
│   │       ├── pedidos/...
│   │       ├── categorias/page.js
│   │       └── envios/page.js
│   ├── components/
│   │   ├── layout/                   # Header, Footer, MobileMenu, AdminSidebar
│   │   ├── product/                  # ProductCard, ProductGrid, VariantSelector, etc.
│   │   ├── cart/                     # CartDrawer, CartItem, CartSummary
│   │   ├── checkout/                 # CustomerForm, ShippingForm, OrderSummary
│   │   └── ui/                       # Button, Input, Badge, Modal, Skeleton, Toast, Pagination
│   ├── hooks/
│   │   ├── useCart.js                # Carrito en localStorage
│   │   ├── useProducts.js           # Fetch + cache
│   │   └── useShipping.js           # Cotización
│   ├── context/
│   │   └── CartContext.jsx           # Provider global
│   ├── lib/
│   │   ├── api.js                    # Fetch wrapper al backend
│   │   └── utils.js                  # Formateo ARS, slugs, helpers
│   └── store/
│       └── adminAuth.js             # Auth state del admin
├── public/images/
├── next.config.js
├── package.json
└── .env.local
```

### 3.2 Carrito (client-side, sin cuenta)

- Persistido en `localStorage` como array de `{ variantId, quantity, addedAt }`
- `CartContext` provee: items, addItem, removeItem, updateQuantity, clearCart, totalItems
- Los datos del producto (nombre, precio, imagen) se fetchean al montar — no se guardan en localStorage para evitar data stale

### 3.3 Páginas y navegación del comprador

- **Home** (`/`): Hero banner + productos destacados + productos en oferta
- **Catálogo** (`/productos`): Grilla paginada con sidebar de filtros (categoría, marca, precio, búsqueda)
- **Categoría** (`/categoria/[slug]`): Productos filtrados por categoría
- **Subcategoría** (`/categoria/[slug]/[sub]`): Filtrados por subcategoría
- **Marca** (`/marca/[slug]`): Filtrados por marca
- **Detalle** (`/productos/[slug]`): Imágenes, descripción, selector de variantes, agregar al carrito
- **Carrito** (`/carrito`): Resumen de items, cantidades editables, subtotal
- **Checkout** (`/checkout`): Formulario step-by-step (datos → dirección/CP → cotización envío → resumen → pagar)
- **Estado del pago** (`/pago/exitoso`, `/pago/pendiente`, `/pago/fallido`): Páginas de retorno de MercadoPago
- **Estado del pedido** (`/pedido/[orderNumber]`): Tracking del pedido post-compra

### 3.4 Diseño visual

- **Tailwind CSS v4** con CSS-first config
- Diseño premium y moderno: paleta curada para belleza/cosmética, tipografía moderna (Google Fonts), micro-animaciones, hover effects
- Fully responsive (mobile-first)
- Dark mode no requerido para V1

---

## 4. Seguridad

| Capa | Medida |
|---|---|
| CORS | Solo acepta requests del dominio del frontend |
| Rate limiting | Limitar requests por IP en endpoints públicos |
| JWT Admin | Tokens con expiración para el panel admin |
| Input validation | Pydantic (back) + validación client-side (front) |
| QStash signature | Verificar firma en webhooks de QStash |
| MP IPN signature | Verificar x-signature + consulta a API de MP |
| SQL Injection | Supabase client con queries parametrizadas |
| XSS | React escapa por defecto + CSP headers |
| Env vars | Secrets nunca expuestos al frontend |
| Soft delete | Productos/categorías nunca se borran, solo se desactivan |
| Stock validation | Verificar stock al crear la orden en el backend |

---

## 5. Dependencias principales

### Backend (Python)
- `fastapi` + `uvicorn` — framework web
- `supabase` — cliente de Supabase para Python
- `mercadopago` — SDK oficial de MercadoPago
- `upstash-workflow` — SDK de QStash/Upstash Workflow
- `pyjwt` — generación/verificación de JWT para admin auth
- `passlib[bcrypt]` — hashing de contraseñas admin
- `pydantic-settings` — configuración via env vars
- `python-multipart` — upload de archivos/imágenes
- `httpx` — HTTP client async

### Frontend (Node.js)
- `next` (14+) — framework React con App Router
- `tailwindcss` (v4) — utilidades CSS
- `@tailwindcss/postcss` — integración PostCSS para Tailwind v4

---

## 6. Variables de entorno

### Backend (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
JWT_SECRET_KEY=
FRONTEND_URL=
BACKEND_URL=
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
```
