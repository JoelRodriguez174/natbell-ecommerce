from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.products import router as products_router
from app.routers.shipping import router as shipping_router
from app.routers.orders import router as orders_router
from app.routers.webhooks import router as webhooks_router
from app.routers.admin.auth import router as admin_auth_router
from app.routers.admin.products import router as admin_products_router
from app.routers.admin.orders import router as admin_orders_router
from app.routers.admin.shipping_zones import router as admin_shipping_zones_router
from app.routers.admin.dashboard import router as admin_dashboard_router

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
app.include_router(orders_router)
app.include_router(webhooks_router)
app.include_router(admin_auth_router)
app.include_router(admin_products_router)
app.include_router(admin_orders_router)
app.include_router(admin_shipping_zones_router)
app.include_router(admin_dashboard_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "Los Arrayanes API"}
