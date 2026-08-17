from __future__ import annotations

from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Foodwise AI"
    api_prefix: str = "/api/v1"
    secret_key: str = getenv("FOODWISE_SECRET_KEY", "foodwise-local-demo-secret")
    demo_date: str = getenv("FOODWISE_DEMO_DATE", "2026-08-15")
    cors_origins: str = getenv("FOODWISE_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
