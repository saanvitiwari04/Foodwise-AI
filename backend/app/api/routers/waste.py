from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.dependencies import current_user
from app.data.seed_data import STORE
from app.domain.models import User, WasteRecord, to_dict
from app.services.analytics import impact_metrics, waste_summary


router = APIRouter(prefix="/waste", tags=["waste"])


class WasteCreate(BaseModel):
    outlet_id: str
    ingredient_id: str
    quantity: float
    reason: str
    stage: str
    inventory_batch_id: str | None = None


@router.get("")
def list_waste(
    outlet_id: str | None = Query(default=None),
    _: User = Depends(current_user),
) -> dict:
    rows = [record for record in STORE.waste_records if outlet_id is None or record.outlet_id == outlet_id]
    return {"waste": to_dict(rows)}


@router.post("", status_code=201)
def create_waste(payload: WasteCreate, user: User = Depends(current_user)) -> dict:
    record = WasteRecord(
        id="pending",
        outlet_id=payload.outlet_id,
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
        reason=payload.reason,
        stage=payload.stage,
        logged_by=user.id,
        inventory_batch_id=payload.inventory_batch_id,
    )
    return to_dict(STORE.add_waste(record))


@router.get("/analytics")
def analytics(
    outlet_id: str | None = Query(default=None),
    group_by: str = Query(default="ingredient"),
    _: User = Depends(current_user),
) -> dict:
    return waste_summary(STORE, outlet_id, group_by)


@router.get("/impact")
def impact(
    outlet_id: str | None = Query(default=None),
    _: User = Depends(current_user),
) -> dict:
    return impact_metrics(STORE, outlet_id)

