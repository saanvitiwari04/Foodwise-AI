from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import current_user
from app.data.seed_data import STORE
from app.domain.models import User, to_dict


router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/outlets")
def outlets(_: User = Depends(current_user)) -> dict:
    return {"outlets": to_dict(STORE.outlets)}


@router.get("/ingredients")
def ingredients(_: User = Depends(current_user)) -> dict:
    return {"ingredients": to_dict(STORE.ingredients)}

