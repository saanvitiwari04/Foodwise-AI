from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.security import create_token
from app.data.seed_data import STORE
from app.domain.models import to_dict


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    user = next((item for item in STORE.users if item.email.lower() == payload.email.lower()), None)
    if user is None or user.password != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "BAD_CREDENTIALS", "message": "Invalid email or password"})
    user_dict = to_dict(user)
    user_dict.pop("password", None)
    return {"token": create_token(user.id), "user": user_dict}
