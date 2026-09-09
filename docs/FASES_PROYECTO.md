# 🗺️ Guía Detallada de Fases del Proyecto — Los Arrayanes E-commerce

Este documento describe de forma exhaustiva cada una de las **8 fases de desarrollo** del e-commerce para **Los Arrayanes**.  
Su propósito es servir como referencia clara, permitiendo revisar en cualquier momento qué incluye cada etapa, sus componentes técnicos, los criterios de testeo y su definición de terminado (*Definition of Done*).

---

## 📌 Metodología de Trabajo y Reglas de Calidad
1. **Desarrollo estrictamente por fases:** Se trabaja exclusivamente en una fase a la vez. No se inician desarrollos de fases posteriores hasta validar y cerrar la fase activa.
2. **Estructura limpia y modularización atómica:** Ningún archivo debe ser monolítico. El frontend se organiza mediante componentes atómicos (`ui/`, `product/`, `cart/`), stores aislados con **Zustand** (`src/store/`) para el manejo de estado global sin acoplamiento, y el backend separa estrictamente capas (`routers/`, `services/`, `models/`, `utils/`), manteniendo funciones y módulos pequeños, puros y con responsabilidad única.
3. **Testeo modular obligatorio:** Cada fase debe contar con pruebas unitarias, de integración o validaciones funcionales verificables que demuestren que los módulos funcionan correctamente y de manera desacoplada.
4. **Validación y confirmación:** Ninguna fase se considera cerrada sin mostrar los resultados de las pruebas y obtener la aprobación del usuario.

---

## 🧭 Resumen del Estado de las Fases

| # | Fase | Estado Actual | Entregable Principal |
|---|---|:---:|---|
| **1** | **Scaffolding y Conectividad Inicial** | ✅ **Completada** | Estructura base FastAPI + Next.js 14 + Tailwind v4 + Health checks |
| **2** | **Base de Datos & Supabase** | ⏳ **Fase Activa / Siguiente** | Esquema relacional PostgreSQL, migraciones, índices y datos semilla |
| **3** | **Backend — Catálogo y APIs Públicas** | ⏸️ Pendiente | Endpoints REST de productos, variantes, filtros y búsqueda |
| **4** | **Frontend — Catálogo y Diseño** | ⏸️ Pendiente | Storefront completo: grilla, filtros, buscador y detalle de producto |
| **5** | **Carrito y Cotizador de Envíos** | ⏸️ Pendiente | Carrito en `localStorage` (guest checkout) y cotizador por zonas/CP |
| **6** | **Checkout, MercadoPago y Webhooks** | ⏸️ Pendiente | Pedidos, pasarela MercadoPago Checkout Pro, webhooks y stock |
| **7** | **Panel de Administración** | ⏸️ Pendiente | Auth admin JWT, dashboard de métricas, CRUD de catálogo y pedidos |
| **8** | **Deploy y Puesta en Producción** | ⏸️ Pendiente | Despliegue en Render + Vercel, secrets de producción y smoke tests |

---

## 🔍 Detalle Profundo Fase por Fase

### 1. Fase 1: Scaffolding y Conectividad Inicial
* **Estado:** ✅ Completada.
* **Objetivo:** Establecer una base limpia, desacoplada y funcional para el backend y frontend, asegurando que ambos se comuniquen fluidamente en desarrollo local.
* **Componentes y Tecnologías:**
  - **Backend:** FastAPI (Python 3.11+), Pydantic Settings para variables de entorno (`app/config.py`), CORS configurado para aceptar peticiones desde el frontend.
  - **Frontend:** Next.js 14+ (App Router), Tailwind CSS v4 con configuración CSS-first y tokens de diseño.
  - **Health check:** Endpoints `/` y `/api/health` en backend consumidos en tiempo real por el frontend en `src/app/page.js`.
* **Pruebas y Verificaciones Realizadas:**
  - Validación de arranque de Uvicorn y Next.js sin errores de sintaxis ni de dependencias.
  - Test de endpoint `/api/health` con retorno de estado `ok` y payload con datos de la fase.
  - Verificación visual de conectividad en el navegador (`localhost:3000` consumiendo `localhost:8000`).

---

### 2. Fase 2: Base de Datos & Supabase
* **Estado:** ⏳ Fase Activa / Siguiente.
* **Objetivo:** Diseñar y desplegar el modelo de datos relacional en PostgreSQL alojado en Supabase, garantizando integridad referencial, tipos adecuados, índices para alto rendimiento y carga inicial de marcas y categorías del negocio real.
* **Componentes y Tablas a Modelar:**
  1. `categories`: Categorías principales (Coloración, Tratamientos, Barbería, etc.) con `slug` único y orden visual.
  2. `subcategories`: Subcategorías vinculadas por foreign key (`category_id`) a `categories`.
  3. `brands`: Marcas reales de Los Arrayanes (~25 marcas: *Nov, Plasma, La Puissance, Playcolor, Kemei, Wahl, etc.*).
  4. `products`: Producto base (nombre, slug, subcategoría FK, marca FK, descripción, precio base, flags `is_featured`, `is_on_sale`, imágenes en JSONB).
  5. `product_variants`: Variantes por tamaño o tono (ej: 250ml, 1000ml, 7.1 Rubio Ceniza) con `sku` único, `price_override` opcional y control de `stock`.
  6. `orders`: Cabecera de pedidos (`order_number` ORD-YYYY-NNNNN, estados `pending`, `paid`, `shipped`, etc., datos de cliente y domicilio para guest checkout).
  7. `order_items`: Detalle de productos comprados (snapshots inmutables de nombre, SKU y precio unitario al momento de la compra).
  8. `payments`: Registro de transacción de MercadoPago (`mp_preference_id`, `mp_payment_id`, status y monto).
  9. `shipping_zones`: Tarifas fijas por zona con rangos de códigos postales en JSONB (`cost`, `estimated_days`).
  10. `admin_users`: Credenciales de administradores con contraseñas hasheadas en bcrypt.
* **Índices y Optimización:**
  - Índices en todas las claves foráneas.
  - Índices únicos en slugs y SKUs.
  - Índice parcial para productos destacados activos (`idx_products_featured WHERE is_active = TRUE`).
* **Pruebas y Verificaciones Requeridas:**
  - Ejecución de migraciones DDL sin conflictos.
  - Script de validación de conexión e inserción/consulta con el cliente oficial `supabase-py`.
  - Verificación de restricciones de integridad (ej: borrado protegido, checks de precios y stock >= 0).
  - Comprobación de carga de datos semilla (marcas y categorías base).

---

### 3. Fase 3: Backend — Catálogo y APIs Públicas
* **Estado:** ⏸️ Pendiente.
* **Objetivo:** Construir los servicios de negocio y endpoints REST de lectura pública que servirán de base para que los clientes consulten el catálogo desde la tienda.
* **Endpoints a Desarrollar:**
  - `GET /api/products`: Listado paginado con filtros combinables (`category`, `subcategory`, `brand`, `min_price`, `max_price`, `sort`, `page`, `per_page`).
  - `GET /api/products/{slug}`: Vista detallada con información completa del producto y su lista de variantes activas con stock.
  - `GET /api/products/featured`: Obtención directa de productos destacados para el hero/home.
  - `GET /api/products/on-sale`: Productos en oferta.
  - `GET /api/products/search?q=`: Búsqueda de texto en títulos de productos y nombres de marcas.
  - `GET /api/categories`: Árbol de categorías con sus subcategorías anidadas.
  - `GET /api/brands`: Listado de marcas comerciales disponibles.
* **Arquitectura de Código:**
  - Schemas Pydantic en `app/models/product.py` para serialización y validación estricta de request/response.
  - Capa de servicios en `app/services/product_service.py` desacoplada de los controladores HTTP.
  - Routers modulares en `app/routers/products.py`.
* **Pruebas y Verificaciones Requeridas:**
  - Tests automatizados con `pytest` y `httpx.AsyncClient`.
  - Verificación de paginación correcta (límites, offsets y totales).
  - Casos de prueba para filtros compuestos (ej: filtrar por marca X + precio entre Y y Z).
  - Validación de respuestas 404 ante slugs inexistentes.

---

### 4. Fase 4: Frontend — Catálogo y Diseño
* **Estado:** ⏸️ Pendiente.
* **Objetivo:** Desarrollar el storefront completo para el cliente final con una estética cuidada, moderna y profesional orientada al sector cosmético y de peluquería, altamente responsiva y rápida.
* **Estructura de Vistas:**
  - **Home (`/`):** Hero section con llamados a la acción, carrusel o grilla de marcas destacadas, y secciones de productos en oferta y recomendados.
  - **Catálogo General (`/productos`):** Grilla interactiva de productos con barra lateral de filtros (categorías, marcas, rangos de precio), barra de búsqueda en tiempo real y selector de ordenamiento.
  - **Vistas por Taxonomía (`/categoria/[slug]`, `/categoria/[slug]/[sub]`, `/marca/[slug]`):** Páginas optimizadas con breadcrumbs y filtrado predeterminado.
  - **Página de Producto (`/productos/[slug]`):** Galería fotográfica, descripción técnica, selector dinámico de variantes (tamaños, tonos) con actualización reactiva de precio/stock y botón "Agregar al carrito".
* **Componentes Reutilizables:**
  - `ProductCard`, `ProductGrid`, `VariantSelector`, `FilterSidebar`, `SearchBar`, `Breadcrumbs`, `Pagination`.
* **Pruebas y Verificaciones Requeridas:**
  - Pruebas de renderizado responsive (mobile, tablet y desktop).
  - Chequeo de tiempos de carga e imágenes optimizadas con `next/image`.
  - Verificación del flujo de navegación desde la home hasta el detalle de producto y selección de variantes.

---

### 5. Fase 5: Carrito y Cotizador de Envíos
* **Estado:** ⏸️ Pendiente.
* **Objetivo:** Permitir una experiencia de compra rápida y sin fricción (Guest Checkout, sin registro obligatorio), manteniendo el estado del carrito en el cliente y cotizando el costo de envío según la localidad y código postal del comprador.
* **Módulos Técnicos:**
  - **Carrito en Cliente (Zustand Store):**
    - Estado global aislado en `src/store/useCartStore.js` con middleware `persist` en `localStorage`.
    - Operaciones puras y atómicas: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `subtotal`.
    - Guarda identificadores de variantes (`variant_id`), cantidades y timestamp.
    - Los datos del producto (precio actual, título, stock) se sincronizan reactivamente con la API para evitar datos obsoletos.
    - Componente Drawer flotante (`CartDrawer`) y vista completa de resumen (`/carrito`).
  - **Cotizador de Envíos (Patrón Strategy):**
    - Interfaz abstracta `ShippingProvider` en backend.
    - Implementación inicial `FixedRateProvider`: consulta tabla `shipping_zones` según rangos de código postal (ej: CABA/GBA, Interior Buenos Aires, Resto del país).
    - Preparado para futura integración en Fase 2 de envíos con `AndreaniProvider`.
    - Endpoint público `GET /api/shipping/quote?postal_code=XXXX`.
* **Pruebas y Verificaciones Requeridas:**
  - Tests unitarios de cálculo de subtotales, totales y tarifas de envío en backend.
  - Pruebas de persistencia en frontend (recarga de página, cierre de pestaña, edición de cantidades y vaciado de carrito).
  - Validación de límites de stock (no permitir agregar más items de los disponibles).
  - Test de cotización ante códigos postales válidos y fuera de rango.

---

### 6. Fase 6: Checkout, MercadoPago y Webhooks
* **Estado:** ⏸️ Pendiente.
* **Objetivo:** Completar el flujo transaccional y de compra: captura de datos del cliente, creación de orden, procesamiento seguro de pagos con MercadoPago Checkout Pro, confirmación asíncrona de pagos mediante webhooks y actualización automática de stock.
* **Flujo Transaccional:**
  1. **Formulario de Checkout (`/checkout`):** Captura en pasos: datos personales (nombre, email, teléfono) + domicilio de entrega (calle, ciudad, provincia, CP) + selección de tarifa de envío.
  2. **Creación de Orden:** Endpoint `POST /api/orders` que valida existencias, reserva stock temporal o definitivo, genera código único `ORD-YYYY-NNNNN` y guarda orden en estado `pending`.
  3. **MercadoPago Checkout Pro:**
     - Generación de preferencia de pago mediante SDK oficial de Python con `items`, `payer`, `back_urls` y `notification_url`.
     - Retorno de URL de pago (`init_point`) y redirección segura del cliente.
  4. **Webhooks Asíncronos:**
     - Recepción de IPN / Webhooks de MercadoPago en `POST /api/webhooks/mercadopago`.
     - Verificación criptográfica de firma `x-signature` para evitar fraudes.
     - Encolado seguro mediante QStash / Upstash Workflow para procesamiento tolerante a fallos.
     - Transición de orden a `paid`, descuento definitivo de inventario en `product_variants`.
  5. **Páginas de Retorno y Tracking:**
     - `/pago/exitoso`, `/pago/pendiente`, `/pago/fallido`.
     - Página pública para el comprador `/pedido/[orderNumber]` para consultar estado de preparación y despacho.
* **Pruebas y Verificaciones Requeridas:**
  - Pruebas de creación de orden con payloads correctos e incompletos.
  - Tests de simulación con credenciales Sandbox de MercadoPago.
  - Test de idempotencia de webhooks (asegurar que un webhook repetido no descuente doble stock ni duplique estados).
  - Verificación de consistencia transaccional en PostgreSQL ante pagos aprobados y rechazados.

---

### 7. Fase 7: Panel de Administración
* **Estado:** ⏸️ Pendiente.
* **Objetivo:** Dotar a los administradores del negocio de una plataforma privada, segura y cómoda para gestionar el catálogo completo, controlar el inventario, revisar los pedidos de los clientes y ajustar costos logísticos.
* **Módulos del Panel (`/admin`):**
  - **Seguridad y Acceso:**
    - Login protegido con credenciales de administrador (`/api/admin/auth/login`).
    - Emisión y verificación de tokens JWT con expiración. Middleware de autenticación en backend (`admin_auth.py`).
    - Protección de rutas en frontend mediante Layout Guard (`src/app/admin/layout.js`).
  - **Dashboard:**
    - Métricas clave: ventas del día/mes, pedidos pendientes de despacho, productos con stock bajo o agotado.
  - **Gestión de Catálogo (CRUD):**
    - Crear, editar y activar/desactivar productos y variantes.
    - Subida de imágenes a Supabase Storage con generación de URLs públicas.
    - Ajuste rápido de precios y stock.
  - **Gestión de Pedidos:**
    - Listado con filtros por estado (`pending`, `paid`, `shipped`, `delivered`, `cancelled`).
    - Vista detallada del pedido (items comprados, datos de contacto del cliente, dirección).
    - Actualización de estado del pedido e ingreso de código de seguimiento de despacho.
  - **Gestión de Tarifas de Envío:**
    - Creación y edición de zonas, costos fijos y rangos de códigos postales.
* **Pruebas y Verificaciones Requeridas:**
  - Pruebas de seguridad: rechazo estricto (401 Unauthorized / 403 Forbidden) en todos los endpoints admin ante peticiones sin token o token expirado.
  - Pruebas de operaciones CRUD (crear producto, modificar variante, cambiar estado de orden).
  - Verificación de soft delete (desactivar productos sin romper órdenes históricas).

---

### 8. Fase 8: Deploy y Puesta en Producción
* **Estado:** ⏸️ Pendiente.
* **Objetivo:** Publicar la aplicación completa en infraestructura cloud moderna, gratuita o de bajo costo, con alta disponibilidad, certificados SSL y variables de entorno de producción debidamente protegidas.
* **Configuración de Infraestructura:**
  - **Backend en Render:** Despliegue de servicio web en Render con Dockerfile optimizado o entorno nativo Python, configurando workers de Uvicorn, health checks automáticos y variables de entorno (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `JWT_SECRET_KEY`, etc.).
  - **Frontend en Vercel:** Conexión con repositorio de GitHub para despliegue continuo (CI/CD) con Next.js optimizado, compresión de assets y variables públicas (`NEXT_PUBLIC_API_URL`).
  - **Base de Datos y Storage en Supabase Cloud:** Proyecto productivo configurado con backups automáticos y bucket público de Supabase Storage para imágenes.
  - **Pasarela de Pagos:** Transición de credenciales de Sandbox a credenciales productivas de MercadoPago, registrando la URL pública de producción del webhook.
* **Pruebas y Verificaciones Requeridas:**
  - Smoke tests en producción: verificar que todos los endpoints respondan en tiempo y forma en los dominios reales.
  - Prueba de compra completa end-to-end (E2E) con monto mínimo de prueba en entorno real.
  - Auditoría de seguridad: verificar que ninguna clave privada o token sensible quede expuesto en el código del cliente.
