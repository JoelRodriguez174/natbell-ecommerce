from app.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import taxonomies, products, shipping

app = FastAPI(
    title=settings.app_name,
    description="API de Backend para Natbell E-commerce",
    version="0.1.0",
)

# Habilitar CORS para permitir peticiones desde el frontend en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers de APIs
app.include_router(taxonomies.router)
app.include_router(products.router)
app.include_router(shipping.router)


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
          "Fase 3 activa: Catálogo y APIs públicas REST (productos, variantes, "
          "filtros, categorías y marcas) 100% operativas."
      ),
  }
