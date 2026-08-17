from __future__ import annotations

import base64
import hashlib
import hmac
import json
from time import time

from app.core.config import settings


def create_token(user_id: str, expires_in_seconds: int = 60 * 60 * 8) -> str:
    payload = {"sub": user_id, "exp": int(time()) + expires_in_seconds}
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    body = base64.urlsafe_b64encode(payload_bytes).decode().rstrip("=")
    signature = hmac.new(settings.secret_key.encode(), body.encode(), hashlib.sha256).digest()
    sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{body}.{sig}"


def decode_token(token: str) -> dict:
    try:
        body, sig = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid token") from exc
    expected = hmac.new(settings.secret_key.encode(), body.encode(), hashlib.sha256).digest()
    expected_sig = base64.urlsafe_b64encode(expected).decode().rstrip("=")
    if not hmac.compare_digest(sig, expected_sig):
        raise ValueError("Invalid token signature")
    padded = body + "=" * (-len(body) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded.encode()))
    if payload.get("exp", 0) < int(time()):
        raise ValueError("Token expired")
    return payload

