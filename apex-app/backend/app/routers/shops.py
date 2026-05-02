"""
Shops Router
GET    /shops                      — list all active shops (with filters)
GET    /shops/:id                  — full shop profile
POST   /shops                      — register new business (owner)
PUT    /shops/:id                  — update shop info (owner)
PATCH  /shops/:id/status           — toggle open/closed today (owner)
GET    /shops/:id/services         — list services for a shop
POST   /shops/:id/services         — add service (owner)
PUT    /services/:id               — update service (owner)
DELETE /services/:id               — remove service (owner)
GET    /shops/:id/slots            — available slots for a date + service
POST   /shops/:id/schedule         — set weekly hours (owner)
POST   /shops/:id/block-dates      — block a date (owner)
GET    /shops/:id/reviews          — reviews for a shop
"""

import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models.salon import Shop, Service, ShopSchedule, BlockedDate, Review, User
from app.schemas.shops import (
    ShopCreate, ShopUpdate, ShopOut, ShopListOut,
    ServiceCreate, ServiceUpdate, ServiceOut,
    ScheduleSet, BlockDateRequest, SlotOut,
)
from app.core.dependencies import get_current_user, require_owner
from app.services.slot_service import get_available_slots
from app.services.whatsapp_service import notify_admin_new_shop

logger = logging.getLogger(__name__)
router = APIRouter()


# ── GET /shops ────────────────────────────────────────────────────────────────
@router.get("", response_model=list[ShopListOut])
async def list_shops(
    category: str | None = Query(None),
    area: str | None = Query(None),
    city: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    filters = [Shop.status == "active"]
    if category:
        filters.append(Shop.category == category)
    if area:
        filters.append(Shop.area.ilike(f"%{area}%"))
    if city:
        filters.append(Shop.city.ilike(f"%{city}%"))

    result = await db.execute(select(Shop).where(and_(*filters)))
    return result.scalars().all()


# ── GET /shops/:id ─────────────────────────────────────────────────────────────
@router.get("/{shop_id}", response_model=ShopOut)
async def get_shop(shop_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop


# ── POST /shops ───────────────────────────────────────────────────────────────
@router.post("", response_model=ShopOut, status_code=status.HTTP_201_CREATED)
async def register_shop(
    body: ShopCreate,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    shop = Shop(**body.model_dump(), owner_id=current_user.id, status="pending")
    db.add(shop)
    await db.commit()
    await db.refresh(shop)

    # Notify admin (fire-and-forget)
    try:
        await notify_admin_new_shop("+910000000000", shop.name, shop.area, shop.category)
    except Exception:
        pass

    return shop


# ── PUT /shops/:id ────────────────────────────────────────────────────────────
@router.put("/{shop_id}", response_model=ShopOut)
async def update_shop(
    shop_id: str,
    body: ShopUpdate,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop or shop.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Shop not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(shop, field, value)

    await db.commit()
    await db.refresh(shop)
    return shop


# ── PATCH /shops/:id/status ───────────────────────────────────────────────────
@router.patch("/{shop_id}/toggle", response_model=dict)
async def toggle_shop(
    shop_id: str,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop or shop.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop.status = "suspended" if shop.status == "active" else "active"
    await db.commit()
    return {"status": shop.status}


# ── SERVICES ──────────────────────────────────────────────────────────────────
@router.get("/{shop_id}/services", response_model=list[ServiceOut])
async def list_services(shop_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.shop_id == shop_id))
    return result.scalars().all()


@router.post("/{shop_id}/services", response_model=ServiceOut, status_code=201)
async def add_service(
    shop_id: str,
    body: ServiceCreate,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop or shop.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Shop not found")

    svc = Service(**body.model_dump(), shop_id=shop_id)
    db.add(svc)
    await db.commit()
    await db.refresh(svc)
    return svc


@router.put("/services/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: str,
    body: ServiceUpdate,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(svc, field, value)

    await db.commit()
    await db.refresh(svc)
    return svc


@router.delete("/services/{service_id}", status_code=204)
async def delete_service(
    service_id: str,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(svc)
    await db.commit()


# ── SLOTS ─────────────────────────────────────────────────────────────────────
@router.get("/{shop_id}/slots", response_model=list[SlotOut])
async def available_slots(
    shop_id: str,
    service_id: str = Query(...),
    slot_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
):
    slots = await get_available_slots(db, shop_id, service_id, slot_date)
    return slots


# ── SCHEDULE ──────────────────────────────────────────────────────────────────
@router.post("/{shop_id}/schedule", status_code=201)
async def set_schedule(
    shop_id: str,
    body: ScheduleSet,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShopSchedule).where(
            and_(ShopSchedule.shop_id == shop_id, ShopSchedule.day_of_week == body.day_of_week)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        for field, value in body.model_dump().items():
            setattr(existing, field, value)
    else:
        sched = ShopSchedule(**body.model_dump(), shop_id=shop_id)
        db.add(sched)

    await db.commit()
    return {"message": "Schedule updated"}


# ── BLOCK DATES ───────────────────────────────────────────────────────────────
@router.post("/{shop_id}/block-dates", status_code=201)
async def block_date(
    shop_id: str,
    body: BlockDateRequest,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    blocked = BlockedDate(**body.model_dump(), shop_id=shop_id)
    db.add(blocked)
    await db.commit()
    return {"message": f"{body.blocked_date} blocked"}


# ── REVIEWS ───────────────────────────────────────────────────────────────────
@router.get("/{shop_id}/reviews")
async def get_reviews(shop_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.shop_id == shop_id))
    reviews = result.scalars().all()
    return reviews
