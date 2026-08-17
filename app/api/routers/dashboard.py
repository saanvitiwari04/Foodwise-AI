from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import current_user
from app.data.seed_data import REFERENCE_DATE, STORE
from app.domain.models import User
from app.services.analytics import impact_metrics
from app.services.forecasting import forecast_for_item
from app.services.recommendations import preparation_recommendations, redistribution_opportunities
from app.services.risk import score_batch_risk


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    outlet_id: str = Query(default="o-1"),
    _: User = Depends(current_user),
) -> dict:
    prep = preparation_recommendations(STORE, outlet_id)
    risk_rows = []
    for batch in STORE.list_batches(outlet_id):
        ingredient = STORE.ingredient(batch.ingredient_id)
        forecast = forecast_for_item(STORE.sales, outlet_id, batch.ingredient_id, batch.expiry_date)
        risk_rows.append(score_batch_risk(batch, ingredient, forecast.predicted_quantity, REFERENCE_DATE))

    high_risk = [row for row in risk_rows if row.risk_level == "high"]
    transfers = [row for row in redistribution_opportunities(STORE) if row.from_outlet_id == outlet_id or row.to_outlet_id == outlet_id]
    impact = impact_metrics(STORE, outlet_id)
    priority_actions = [
        {
            "item": STORE.ingredient(row.ingredient_id).name,
            "severity": row.risk_level,
            "message": row.rationale,
        }
        for row in high_risk[:5]
    ]
    return {
        "todays_prep_quantity": round(sum(row.recommended_prep_quantity for row in prep), 2),
        "high_risk_batches": len(high_risk),
        "cost_saved_this_week": impact["estimated_cost_saved_this_week"],
        "redistribution_opportunities": len(transfers),
        "priority_actions": priority_actions,
    }
