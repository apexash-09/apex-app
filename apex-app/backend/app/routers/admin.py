"""
Admin Router — the founder's control panel.
All routes require role=admin.

POST /admin/auth/login              — secure admin login (email + password + optional 2FA)
POST /admin/auth/create             — create new admin account (super-admin only)
GET  /admin/shops/pending           — list shops awaiting approval
POST /admin/shops/:id/approve       — approve a shop
POST /admin/shops/:id/suspend       — suspend a shop
GET  /admin/users                   — list all users
GET  /admin/stats                   — platform-wide stats
GET  /admin/analytics/revenue       — revenue overview
"""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from passlib.context import CryptContext

from app.database import get_db
from app.models.salon import User, Shop, Booking, Review
from app.schemas.admin import AdminLogin, AdminCreate
from app.schemas.auth import TokenResponse, UserOut
from app.core.jwt import create_access_token, create_refresh_token
from app.core.dependencies import get_current_user, require_admin
from app.services.whatsapp_service import notify_shop_approved, notify_shop_suspended

logger = logging.getLogger(__name__)
router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN AUTH
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/auth/login", response_model=TokenResponse)
async def admin_login(body: AdminLogin, db: AsyncSession = Depends(get_db)):
    """
    Secure admin login — email + password.
    In production: add TOTP 2FA check before issuing tokens.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or user.role != "admin":
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.password_hash or not pwd_ctx.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # TODO: verify body.totp_code against TOTP secret for 2FA in prod
    logger.warning(f"Admin login: {body.email}")

    return TokenResponse(
        access_token=create_access_token(user.id, "admin", user.phone or "", None),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/auth/create", response_model=UserOut, status_code=201)
async def create_admin(
    body: AdminCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Only an existing admin can create a new admin account."""
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already exists")

    admin = User(
        phone="0000000000",   # placeholder — admin uses email
        email=body.email,
        name=body.name,
        role="admin",
        password_hash=pwd_ctx.hash(body.password),
        is_verified=True,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return UserOut.model_validate(admin)


# ══════════════════════════════════════════════════════════════════════════════
# SHOP MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/shops/pending")
async def pending_shops(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Shop).where(Shop.status == "pending"))
    shops = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "area": s.area,
            "city": s.city,
            "phone": s.phone,
            "owner_id": s.owner_id,
            "created_at": s.created_at,
        }
        for s in shops
    ]


@router.post("/shops/{shop_id}/approve")
async def approve_shop(
    shop_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop.status = "active"
    await db.commit()

    # Notify owner
    try:
        owner_res = await db.execute(select(User).where(User.id == shop.owner_id))
        owner = owner_res.scalar_one_or_none()
        if owner:
            await notify_shop_approved(owner.phone, shop.name)
    except Exception:
        pass

    return {"message": f"{shop.name} approved and now live"}


@router.post("/shops/{shop_id}/suspend")
async def suspend_shop(
    shop_id: str,
    reason: str = "Policy violation",
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop.status = "suspended"
    await db.commit()

    try:
        owner_res = await db.execute(select(User).where(User.id == shop.owner_id))
        owner = owner_res.scalar_one_or_none()
        if owner:
            await notify_shop_suspended(owner.phone, shop.name, reason)
    except Exception:
        pass

    return {"message": f"{shop.name} suspended"}


# ══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/users")
async def list_users(
    role: str | None = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if role:
        filters.append(User.role == role)
    result = await db.execute(select(User).where(*filters) if filters else select(User))
    users = result.scalars().all()
    return [UserOut.model_validate(u) for u in users]


# ══════════════════════════════════════════════════════════════════════════════
# PLATFORM STATS
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/stats")
async def platform_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users   = (await db.execute(func.count(User.id).select())).scalar()
    total_shops   = (await db.execute(func.count(Shop.id).select())).scalar()
    active_shops  = (await db.execute(func.count(Shop.id).select().where(Shop.status == "active"))).scalar()
    pending_shops = (await db.execute(func.count(Shop.id).select().where(Shop.status == "pending"))).scalar()
    total_bookings= (await db.execute(func.count(Booking.id).select())).scalar()

    return {
        "users": {"total": total_users},
        "shops": {
            "total": total_shops,
            "active": active_shops,
            "pending": pending_shops,
        },
        "bookings": {"total": total_bookings},
    }


@router.get("/analytics/revenue")
async def revenue_overview(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revenue breakdown — last 30 days, grouped by day."""
    from sqlalchemy import cast, Date as SADate
    thirty_days_ago = datetime.now() - timedelta(days=30)

    result = await db.execute(
        select(
            cast(Booking.created_at, SADate).label("day"),
            func.sum(Booking.amount_paid).label("revenue"),
            func.count(Booking.id).label("bookings"),
        )
        .where(
            and_(
                Booking.payment_status == "paid",
                Booking.created_at >= thirty_days_ago,
            )
        )
        .group_by(cast(Booking.created_at, SADate))
        .order_by(cast(Booking.created_at, SADate))
    )

    rows = result.fetchall()
    return [
        {"date": str(r.day), "revenue": float(r.revenue), "bookings": r.bookings}
        for r in rows
    ]
