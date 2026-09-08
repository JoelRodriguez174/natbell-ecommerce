from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.products import router as products_router
from app.routers.shipping import router as shipping_router

app = FastAPI(title="Los Arrayanes API", version="1.0.0")

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

app.include_router(products_router)
app.include_router(shipping_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "Los Arrayanes API"}
