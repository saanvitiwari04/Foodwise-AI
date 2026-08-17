from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.security import decode_token
from app.data.seed_data import STORE, DemoStore
from app.domain.models import User


def get_store() -> DemoStore:
    return STORE


def current_user(authorization: Annotated[str | None, Header()] = None) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "NOT_AUTHENTICATED", "message": "Bearer token required"})
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_TOKEN", "message": str(exc)}) from exc
    user = next((item for item in STORE.users if item.id == payload["sub"]), None)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_TOKEN", "message": "User not found"})
    return user


def require_manager(user: Annotated[User, Depends(current_user)]) -> User:
    if user.role not in ("admin", "manager"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "Manager or admin role required"})
    return user

