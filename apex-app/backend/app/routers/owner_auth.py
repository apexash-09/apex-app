"""
Owner Auth Router  — email + password login for business owners.
Separate from customer OTP flow.

POST /owner/auth/register   — register as owner (creates User with role=owner)
POST /owner/auth/login      — email + password → JWT pair
POST /owner/auth/change-password
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models.salon import User
from app.schemas.admin import OwnerRegister, OwnerLogin, PasswordChange
from app.schemas.auth import TokenResponse, UserOut
from app.core.jwt import create_access_token, create_refresh_token
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=UserOut, status_code=201)
async def owner_register(body: OwnerRegister, db: AsyncSession = Depends(get_db)):
    """Register a new business owner account."""

    # Check email unique
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Check phone unique
    result2 = await db.execute(select(User).where(User.phone == body.phone))
    if result2.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        phone=body.phone,
        email=body.email,
        name=body.name,
        role="owner",
        password_hash=pwd_ctx.hash(body.password),
        is_verified=True,  # email-based, no OTP needed
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"New owner registered: {body.email}")
    return UserOut.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def owner_login(body: OwnerLogin, db: AsyncSession = Depends(get_db)):
    """Email + password login for business owners."""

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or user.role not in ("owner", "admin"):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.password_hash or not pwd_ctx.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    shop_id = None
    if user.shops:
        shop_id = user.shops[0].id

    return TokenResponse(
        access_token=create_access_token(user.id, user.role, user.phone or "", shop_id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/change-password")
async def change_password(
    body: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.password_hash:
        raise HTTPException(status_code=400, detail="No password set — use OTP login")

    if not pwd_ctx.verify(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password incorrect")

    current_user.password_hash = pwd_ctx.hash(body.new_password)
    await db.commit()
    return {"message": "Password updated"}
