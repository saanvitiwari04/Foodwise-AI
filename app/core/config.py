from __future__ import annotations

from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Foodwise AI"
    api_prefix: str = "/api/v1"
    secret_key: str = getenv("FOODWISE_SECRET_KEY", "foodwise-local-demo-secret")
    demo_date: str = getenv("FOODWISE_DEMO_DATE", "2026-08-15")


settings = Settings()

