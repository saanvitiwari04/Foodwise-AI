from __future__ import annotations

from datetime import date
from statistics import mean

from app.domain.models import ForecastResult, Sale


def forecast_for_item(
    sales: list[Sale],
    outlet_id: str,
    ingredient_id: str,
    target_date: date,
) -> ForecastResult:
    history = [
        sale
        for sale in sales
        if sale.outlet_id == outlet_id
        and sale.ingredient_id == ingredient_id
        and sale.sale_date < target_date
    ]
    if not history:
        return ForecastResult(outlet_id, ingredient_id, target_date, 0.0, 0.0, 0.0, "No sales history available yet.")

    same_weekday = [sale.quantity_sold for sale in history if sale.sale_date.weekday() == target_date.weekday()][-6:]
    recent = [sale.quantity_sold for sale in history][-14:]
    weekday_average = mean(same_weekday) if same_weekday else mean(recent)
    recent_average = mean(recent)

    first_week = mean([sale.quantity_sold for sale in history[:7]])
    last_week = mean([sale.quantity_sold for sale in history[-7:]])
    trend_factor = 1 + max(min((last_week - first_week) / max(first_week, 1), 0.12), -0.12)
    event_factor = 1.08 if target_date.weekday() in (5, 6) else 1.0

    predicted = round(((weekday_average * 0.65) + (recent_average * 0.35)) * trend_factor * event_factor, 2)
    lower = round(predicted * 0.85, 2)
    upper = round(predicted * 1.15, 2)
    rationale = (
        f"Based on the last {len(same_weekday) or len(recent)} comparable sales days, "
        f"recent average {recent_average:.2f}, trend factor {trend_factor:.2f}, "
        f"and day/event factor {event_factor:.2f}."
    )
    return ForecastResult(outlet_id, ingredient_id, target_date, predicted, lower, upper, rationale)


def forecasts_for_outlet(sales: list[Sale], outlet_id: str, ingredient_ids: list[str], target_date: date) -> list[ForecastResult]:
    return [forecast_for_item(sales, outlet_id, ingredient_id, target_date) for ingredient_id in ingredient_ids]

