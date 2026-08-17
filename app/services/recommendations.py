from __future__ import annotations

from datetime import date

from app.data.seed_data import DemoStore, REFERENCE_DATE
from app.domain.models import (
    PreparationRecommendation,
    ProcurementRecommendation,
    RedistributionOpportunity,
)
from app.services.forecasting import forecast_for_item


def procurement_recommendations(store: DemoStore, outlet_id: str, target_date: date = REFERENCE_DATE) -> list[ProcurementRecommendation]:
    recs: list[ProcurementRecommendation] = []
    for ingredient in store.ingredients:
        stock = store.total_stock(outlet_id, ingredient.id)
        forecast = forecast_for_item(store.sales, outlet_id, ingredient.id, target_date)
        safety_buffer = forecast.predicted_quantity * (0.18 if ingredient.perishability >= 0.75 else 0.1)
        needed = round(forecast.predicted_quantity + safety_buffer - stock, 2)
        if needed > 0.5:
            action = "buy"
            qty = needed
            rationale = f"Forecast demand {forecast.predicted_quantity:g} {ingredient.unit} plus buffer exceeds current stock {stock:g} {ingredient.unit}."
        elif stock > forecast.predicted_quantity * 2 and ingredient.perishability >= 0.7:
            action = "reduce"
            qty = round(stock - forecast.predicted_quantity * 1.25, 2)
            rationale = f"Current stock {stock:g} {ingredient.unit} is above near-term demand {forecast.predicted_quantity:g} {ingredient.unit}; reduce the next order."
        else:
            action = "delay"
            qty = 0.0
            rationale = f"Current stock {stock:g} {ingredient.unit} covers forecast demand {forecast.predicted_quantity:g} {ingredient.unit}."
        recs.append(ProcurementRecommendation(f"proc-{outlet_id}-{ingredient.id}", outlet_id, ingredient.id, action, max(qty, 0.0), rationale))
    return recs


def preparation_recommendations(store: DemoStore, outlet_id: str, target_date: date = REFERENCE_DATE) -> list[PreparationRecommendation]:
    recs: list[PreparationRecommendation] = []
    for ingredient in store.ingredients:
        forecast = forecast_for_item(store.sales, outlet_id, ingredient.id, target_date)
        buffer = 1.04 if ingredient.perishability >= 0.75 else 1.08
        prep_qty = round(forecast.predicted_quantity * buffer, 2)
        rationale = f"Prep quantity applies a {buffer:.0%} service buffer to predicted demand of {forecast.predicted_quantity:g} {ingredient.unit}."
        recs.append(PreparationRecommendation(f"prep-{outlet_id}-{ingredient.id}", outlet_id, ingredient.id, target_date, forecast.predicted_quantity, prep_qty, rationale))
    return recs


def redistribution_opportunities(store: DemoStore, target_date: date = REFERENCE_DATE) -> list[RedistributionOpportunity]:
    opportunities: list[RedistributionOpportunity] = []
    for ingredient in store.ingredients:
        balances: list[tuple[str, float, float, float]] = []
        for outlet in store.outlets:
            stock = store.total_stock(outlet.id, ingredient.id)
            forecast = forecast_for_item(store.sales, outlet.id, ingredient.id, target_date).predicted_quantity
            balance = round(stock - forecast, 2)
            balances.append((outlet.id, stock, forecast, balance))

        surplus = sorted([row for row in balances if row[3] > max(row[2] * 0.25, 1.0)], key=lambda row: row[3], reverse=True)
        shortage = sorted([row for row in balances if row[3] < -0.5], key=lambda row: row[3])
        for source in surplus:
            for sink in shortage:
                qty = round(min(source[3], abs(sink[3])), 2)
                if qty <= 0:
                    continue
                source_outlet = store.outlet(source[0]).name
                sink_outlet = store.outlet(sink[0]).name
                rationale = (
                    f"{source_outlet} has {source[1]:g} {ingredient.unit} with expected use {source[2]:g}; "
                    f"{sink_outlet} has {sink[1]:g} with expected use {sink[2]:g}."
                )
                opportunities.append(
                    RedistributionOpportunity(f"rd-{ingredient.id}-{source[0]}-{sink[0]}", ingredient.id, source[0], sink[0], qty, rationale)
                )
                break
    return opportunities

