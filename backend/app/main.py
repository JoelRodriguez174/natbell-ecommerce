from app.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.app_name,
    description="API de Backend para Los Arrayanes E-commerce",
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
          "Fase 1 completada con éxito: Backend operativo y listo para"
          " conectar con el frontend."
      ),
  }
