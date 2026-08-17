from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import current_user
from app.data.seed_data import REFERENCE_DATE, STORE
from app.domain.models import User, to_dict
from app.services.forecasting import forecast_for_item, forecasts_for_outlet


router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("")
def forecast(
    outlet_id: str = Query(...),
    target_date: date = Query(default=REFERENCE_DATE, alias="date"),
    _: User = Depends(current_user),
) -> dict:
    items = [item.id for item in STORE.ingredients]
    return {"outlet_id": outlet_id, "date": target_date.isoformat(), "forecast": to_dict(forecasts_for_outlet(STORE.sales, outlet_id, items, target_date))}


@router.get("/{ingredient_id}")
def forecast_item(
    ingredient_id: str,
    outlet_id: str = Query(...),
    target_date: date = Query(default=REFERENCE_DATE, alias="date"),
    _: User = Depends(current_user),
) -> dict:
    return to_dict(forecast_for_item(STORE.sales, outlet_id, ingredient_id, target_date))

