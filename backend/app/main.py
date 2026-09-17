from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings
from app.routers import (
    admin_auth,
    admin_catalog,
    admin_dashboard,
    admin_orders,
    admin_shipping,
    orders,
    products,
    shipping,
    taxonomies,
    webhooks,
)

app = FastAPI(
    title=settings.app_name,
    description="API de Backend para Natbell E-commerce",
    version="0.1.0",
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware para inyectar cabeceras defensivas HTTP de grado producción."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com; "
            "connect-src 'self' https:;"
        )
        return response


# Middleware de seguridad HTTP
app.add_middleware(SecurityHeadersMiddleware)

# Habilitar CORS con orígenes configurables (soporte para Render/Vercel y desarrollo local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers de APIs
app.include_router(taxonomies.router)
app.include_router(products.router)
app.include_router(shipping.router)
app.include_router(orders.router)
app.include_router(webhooks.router)
app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_catalog.router)
app.include_router(admin_orders.router)
app.include_router(admin_shipping.router)


@app.get("/")
async def root():
    """Ruta raíz con información general y enlaces útiles."""
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "phase": settings.phase,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health",
    }


@app.get("/api/health")
async def health_check():
    """Endpoint de salud del backend para verificar conectividad."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "phase": settings.phase,
        "message": (
            "Fase 8 activa: Preparado para Deploy en Producción (Render + Vercel + Supabase)."
        ),
    }

