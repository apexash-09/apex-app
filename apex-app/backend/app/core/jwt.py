"""
JWT token utilities — create, verify, and decode access & refresh tokens.
"""

from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings


# ── Token creation ─────────────────────────────────────────────────────────────
def _create_token(
    payload: dict,
    secret: str,
    expire_delta: timedelta,
) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + expire_delta
    data["iat"] = datetime.now(timezone.utc)
    return jwt.encode(data, secret, algorithm="HS256")


def create_access_token(user_id: str, role: str, phone: str, shop_id: str | None = None) -> str:
    return _create_token(
        payload={"sub": user_id, "role": role, "phone": phone, "shop_id": shop_id},
        secret=settings.JWT_SECRET_KEY,
        expire_delta=timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        payload={"sub": user_id, "type": "refresh"},
        secret=settings.JWT_REFRESH_SECRET,
        expire_delta=timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )


# ── Token verification ─────────────────────────────────────────────────────────
def _decode(token: str, secret: str) -> dict:
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_access_token(token: str) -> dict:
    return _decode(token, settings.JWT_SECRET_KEY)


def decode_refresh_token(token: str) -> dict:
    payload = _decode(token, settings.JWT_REFRESH_SECRET)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token")
    return payload
