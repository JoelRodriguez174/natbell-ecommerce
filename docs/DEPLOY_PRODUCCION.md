# 🚀 Guía Oficial de Puesta en Producción — Natbell E-commerce (Los Arrayanes)

Esta guía detalla paso a paso el procedimiento operativo para desplegar la arquitectura completa de **Natbell E-commerce** en los proveedores cloud seleccionados (**Render** para el Backend, **Vercel** para el Frontend, **Supabase Cloud** para la Base de Datos y Storage, y **MercadoPago** en modo productivo).

---

## 📋 Resumen de la Arquitectura Productiva

| Componente | Proveedor Cloud | Modelo de Despliegue | URL de Referencia |
|---|---|---|---|
| **Frontend** | **Vercel** | Next.js 14 App Router (Edge CDN) | `https://natbell.vercel.app` |
| **Backend** | **Render** | FastAPI Web Service (Python 3.13 / Docker) | `https://natbell-api.onrender.com` |
| **Base de Datos** | **Supabase Cloud** | PostgreSQL gestionado con RLS | Supabase Dashboard |
| **Storage** | **Supabase Storage** | Bucket público CDN (`products`) | Supabase Dashboard |
| **Pasarela** | **MercadoPago** | Checkout Pro (Credenciales `APP_USR-...`) | MercadoPago Developers |

---

## 🛠️ Paso 1: Base de Datos y Storage en Supabase Cloud

1. **Acceso al Proyecto:**
   - Iniciar sesión en [Supabase Cloud](https://supabase.com/dashboard) y seleccionar el proyecto de Natbell.
2. **Verificación de Migraciones y Tablas:**
   - En el **SQL Editor** o **Table Editor**, verificar que todas las tablas de las Fases 2, 6 y 7 existan:
     - `categories`, `subcategories`, `brands`, `products`, `product_variants`.
     - `orders`, `order_items`, `payments`, `shipping_zones`, `admin_users`.
3. **Bucket de Almacenamiento de Catálogo:**
   - En **Storage**, verificar que el bucket `products` exista y tenga activada la opción **Public Bucket**.
   - En caso de requerir subir las imágenes del catálogo local:
     ```bash
     python scripts/upload_catalog_images.py --bucket products --update-db
     ```
4. **Obtención de Claves:**
   - En **Project Settings -> API**:
     - Copiar **Project URL** (`SUPABASE_URL`).
     - Copiar clave `service_role` (secreta) para `SUPABASE_SERVICE_KEY`.
     - Copiar clave `anon public` para `SUPABASE_ANON_KEY`.

---

## 🐍 Paso 2: Despliegue del Backend en Render

1. **Creación del Web Service:**
   - Iniciar sesión en [Render](https://dashboard.render.com/).
   - Clic en **New +** -> **Web Service**.
   - Conectar el repositorio de GitHub: `JoelRodriguez174/natbell-ecommerce`.
2. **Configuración del Servicio:**
   - **Name:** `natbell-api` (o `losarrayanes-api`).
   - **Root Directory:** `backend`.
   - **Runtime:** `Python` (o `Docker` si se prefiere contenedor).
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`
   - **Instance Type:** `Free` o `Starter`.
   - **Health Check Path:** `/api/health`
3. **Variables de Entorno (Environment Variables):**
   Cargar las siguientes variables (tomar como referencia `backend/.env.production.example`):
   ```ini
   PYTHON_VERSION=3.13.0
   APP_NAME="Natbell API"
   PHASE=8
   FRONTEND_URL="https://tu-dominio-vercel.vercel.app"
   BACKEND_URL="https://natbell-api.onrender.com"
   ALLOWED_ORIGINS="https://tu-dominio-vercel.vercel.app,https://www.natbell.com.ar"
   SUPABASE_URL="https://xyzcompany.supabase.co"
   SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsIn..."
   SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsIn..."
   MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
   MERCADOPAGO_PUBLIC_KEY="APP_USR-..."
   MERCADOPAGO_WEBHOOK_SECRET="tu_firma_secreta"
   MERCADOPAGO_SANDBOX=false
   MERCADOPAGO_MODE=real
   JWT_SECRET_KEY="tu-clave-secreta-larga-min-64-caracteres"
   ```
4. **Deploy:**
   - Clic en **Create Web Service**.
   - Render construirá la imagen, instalará dependencias e iniciará Uvicorn.
   - El endpoint `/api/health` responderá `{"status": "ok", "phase": 8}`.

---

## ⚡ Paso 3: Despliegue del Frontend en Vercel

1. **Importar Proyecto en Vercel:**
   - Iniciar sesión en [Vercel](https://vercel.com/dashboard).
   - Clic en **Add New...** -> **Project**.
   - Seleccionar el repositorio `JoelRodriguez174/natbell-ecommerce`.
2. **Configuración de Build:**
   - **Root Directory:** Seleccionar `frontend` (¡Fundamental!).
   - **Framework Preset:** `Next.js`.
   - **Build Command:** `next build` (automático).
   - **Output Directory:** `.next` (automático).
3. **Variables de Entorno:**
   - En **Environment Variables**, añadir:
     - `NEXT_PUBLIC_API_URL` = `https://natbell-api.onrender.com` (la URL pública generada en Render, SIN barra al final).
     - `NEXT_PUBLIC_MP_PUBLIC_KEY` = `APP_USR-...` (tu clave pública productiva de MercadoPago).
4. **Deploy:**
   - Clic en **Deploy**.
   - Vercel compilará todas las 17 rutas y distribuirá la aplicación globalmente en Edge CDN.

---

## 💳 Paso 4: Transición Productiva de MercadoPago

1. **Credenciales de Producción:**
   - Ingresar a [MercadoPago Developers Dashboard](https://www.mercadopago.com.ar/developers/panel).
   - Ir a **Tus integraciones** -> Seleccionar la aplicación de Natbell.
   - En **Credenciales de producción**, activar las credenciales completando los datos comerciales solicitados por MercadoPago.
   - Copiar el `Access Token` (`APP_USR-...`) y la `Public Key`.
2. **Configuración de Webhooks (IPN):**
   - En el panel de MercadoPago, ir a **Notificaciones Webhooks**.
   - Configurar la URL productiva:
     ```
     https://natbell-api.onrender.com/api/webhooks/mercadopago
     ```
   - Seleccionar el evento: **Pagos (Payments)**.
   - Copiar el **Secret de Webhooks** y pegarlo en la variable de entorno `MERCADOPAGO_WEBHOOK_SECRET` en Render.
3. **Verificación de Sandbox Desactivado:**
   - Confirmar en Render que `MERCADOPAGO_SANDBOX=false`.
   - Los compradores serán redirigidos a la pasarela real de MercadoPago.

---

## 🔍 Paso 5: Smoke Tests Automatizados de Verificación

Una vez finalizados los despliegues en Render y Vercel, ejecutar el script de verificación automatizada contra la URL pública de producción:

```bash
python scripts/smoke_test_production.py --target https://natbell-api.onrender.com
```

El script validará en segundos:
- [x] Conectividad y respuesta de la raíz `/`.
- [x] Health check en `/api/health` con Fase 8 activa.
- [x] Presencia de cabeceras de seguridad HTTP (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- [x] Respuesta CORS ante dominios de Vercel.
- [x] Árbol de categorías y marcas comerciales disponibles.
- [x] Catálogo de productos paginado con datos relacionales.
- [x] Cotizador de envíos por código postal.
- [x] Protección 401 de endpoints administrativos no autenticados.

---

## 🔐 Paso 6: Acceso y Operación del Panel Administrador

1. **Ingreso al Panel:**
   - Navegar a `https://natbell.vercel.app/admin/login`.
2. **Credenciales:**
   - Ingresar con el correo de administrador registrado en la tabla `admin_users` de Supabase.
   - Si no se cuenta con un usuario administrador creado, se puede generar uno mediante un script o query SQL insertando la contraseña hasheada con bcrypt (`$2b$12$...`).
3. **Operaciones Disponibles:**
   - Dashboard de KPIs (ventas, pedidos por despachar, stock crítico).
   - Catálogo (altas, bajas lógicas, edición de variantes y fotos).
   - Pedidos (seguimiento de envíos, cambio de estado a `shipped` con código de tracking).
   - Envíos (ajuste de tarifas y zonas).
