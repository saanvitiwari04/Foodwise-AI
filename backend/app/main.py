from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import alerts, auth, catalog, dashboard, forecast, inventory, recommendations, risk, waste
from app.core.config import settings


app = FastAPI(
    title="Foodwise AI Backend",
    version="0.1.0",
    description="Backend-focused SIH prototype for demand forecasting, waste risk, recommendations, and analytics.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    catalog.router,
    dashboard.router,
    inventory.router,
    forecast.router,
    risk.router,
    recommendations.router,
    waste.router,
    alerts.router,
):
    app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
def health() -> dict:
    return {"name": settings.app_name, "status": "ok", "docs": "/docs", "api_prefix": settings.api_prefix}
