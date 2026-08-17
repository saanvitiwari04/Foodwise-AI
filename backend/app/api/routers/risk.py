from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import current_user
from app.data.seed_data import REFERENCE_DATE, STORE
from app.domain.models import User, to_dict
from app.services.forecasting import forecast_for_item
from app.services.risk import score_batch_risk


router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("")
def risks(
    outlet_id: str | None = Query(default=None),
    target_date: date = Query(default=REFERENCE_DATE, alias="date"),
    _: User = Depends(current_user),
) -> dict:
    results = []
    for batch in STORE.list_batches(outlet_id):
        ingredient = STORE.ingredient(batch.ingredient_id)
        forecast = forecast_for_item(STORE.sales, batch.outlet_id, batch.ingredient_id, target_date)
        results.append(score_batch_risk(batch, ingredient, forecast.predicted_quantity, REFERENCE_DATE))
    return {"risks": to_dict(results)}

