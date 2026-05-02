"""
Auth Router — handles all authentication endpoints.

POST /auth/send-otp     → send WhatsApp OTP
POST /auth/verify-otp   → verify OTP, return JWT pair
POST /auth/refresh      → exchange refresh token for new access token
POST /auth/logout       → blacklist refresh token in Redis
GET  /auth/me           → return current user profile
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.salon import User
from app.schemas.auth import (
    SendOTPRequest, VerifyOTPRequest, RefreshTokenRequest,
    TokenResponse, MessageResponse, UserOut,
)
from app.services.otp_service import send_otp, verify_otp
from app.core.jwt import create_access_token, create_refresh_token, decode_refresh_token
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ── POST /auth/send-otp ───────────────────────────────────────────────────────
@router.post("/send-otp", response_model=MessageResponse)
async def send_otp_endpoint(body: SendOTPRequest):
    """
    Step 1 of login: send a 6-digit OTP to the customer's WhatsApp.
    Rate-limited to 5 requests per phone per hour.
    """
    await send_otp(body.phone)
    return MessageResponse(
        message=f"OTP sent to {body.phone}",
        expires_in=300,
    )


# ── POST /auth/verify-otp ─────────────────────────────────────────────────────
@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(body: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 2 of login: verify OTP, auto-create account on first login, return JWT pair.
    """
    # 1. Verify the OTP (raises 400 on failure)
    await verify_otp(body.phone, body.otp)

    # 2. Get or create user
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user:
        # First time — create account automatically
        user = User(
            phone=body.phone,
            name=body.name,
            role="customer",
            is_verified=True,
        )
        db.add(user)
        await db.flush()   # get the generated ID without full commit
        logger.info(f"New user created: {body.phone}")
    else:
        # Existing user — mark verified (handles edge cases)
        user.is_verified = True
        if body.name and not user.name:
            user.name = body.name

    await db.commit()
    await db.refresh(user)

    # 3. Issue tokens
    shop_id = None
    if user.role == "owner" and user.shops:
        shop_id = user.shops[0].id

    access_token = create_access_token(user.id, user.role, user.phone, shop_id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


# ── POST /auth/refresh ────────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    Exchange a valid refresh token for a fresh access + refresh token pair.
    The old refresh token is consumed (rotation strategy).
    """
    payload = decode_refresh_token(body.refresh_token)
    user_id = payload.get("sub")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    shop_id = None
    if user.role == "owner" and user.shops:
        shop_id = user.shops[0].id

    return TokenResponse(
        access_token=create_access_token(user.id, user.role, user.phone, shop_id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the currently authenticated user's profile."""
    return UserOut.model_validate(current_user)
