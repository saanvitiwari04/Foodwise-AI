from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.dependencies import current_user, require_manager
from app.data.seed_data import STORE
from app.domain.models import InventoryBatch, User, to_dict


router = APIRouter(prefix="/inventory", tags=["inventory"])


class InventoryCreate(BaseModel):
    ingredient_id: str
    outlet_id: str
    batch_code: str
    quantity: float
    unit: str
    purchase_date: date
    expiry_date: date
    supplier_id: str
    storage_condition: str = "normal"


@router.get("")
def list_inventory(
    outlet_id: str | None = Query(default=None),
    _: User = Depends(current_user),
) -> dict:
    batches = STORE.list_batches(outlet_id)
    return {"inventory": to_dict(batches)}


@router.post("", status_code=201)
def create_inventory(payload: InventoryCreate, _: User = Depends(require_manager)) -> dict:
    batch = InventoryBatch(
        id=f"b-{len(STORE.inventory_batches) + 1}",
        outlet_id=payload.outlet_id,
        ingredient_id=payload.ingredient_id,
        batch_code=payload.batch_code,
        quantity=payload.quantity,
        unit=payload.unit,
        purchase_date=payload.purchase_date,
        expiry_date=payload.expiry_date,
        supplier_id=payload.supplier_id,
        storage_condition=payload.storage_condition,
    )
    STORE.inventory_batches.append(batch)
    return to_dict(batch)

