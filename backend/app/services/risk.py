from __future__ import annotations

from datetime import date

from app.domain.models import Ingredient, InventoryBatch, RiskResult


def score_batch_risk(
    batch: InventoryBatch,
    ingredient: Ingredient,
    predicted_consumption: float,
    today: date,
) -> RiskResult:
    days_to_expiry = (batch.expiry_date - today).days
    shelf_pressure = 1.0 if days_to_expiry <= 0 else max(0.0, 1 - (days_to_expiry / max(ingredient.default_shelf_life_days, 1)))
    unused_after_forecast = max(batch.quantity - predicted_consumption, 0)
    surplus_pressure = min(unused_after_forecast / max(batch.quantity, 1), 1.0)
    quantity_pressure = min(batch.quantity / max(predicted_consumption * 2, 1), 1.0)
    storage_pressure = 0.15 if batch.storage_condition != "normal" else 0.0

    score = round(
        min(
            (0.42 * shelf_pressure)
            + (0.28 * surplus_pressure)
            + (0.18 * ingredient.perishability)
            + (0.12 * quantity_pressure)
            + storage_pressure,
            1.0,
        ),
        2,
    )
    if score >= 0.72:
        level = "high"
    elif score >= 0.45:
        level = "medium"
    else:
        level = "low"

    rationale = (
        f"{batch.quantity:g} {batch.unit} remaining, expires in {days_to_expiry} day(s), "
        f"predicted next-service use is {predicted_consumption:g} {batch.unit}; "
        f"unused risk is {unused_after_forecast:g} {batch.unit}."
    )
    return RiskResult(batch.id, batch.outlet_id, batch.ingredient_id, level, score, rationale)

