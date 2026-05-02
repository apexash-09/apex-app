"""
Bookings Router
POST   /bookings                   — create booking (customer)
GET    /bookings/my                — my bookings (customer)
GET    /bookings/shop/:id          — shop's bookings (owner)
GET    /bookings/:id               — single booking detail
PATCH  /bookings/:id/status        — owner updates status
DELETE /bookings/:id               — customer cancels
POST   /bookings/:id/review        — submit review after completion
"""

import random
import string
import logging
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database import get_db
from app.models.salon import Booking, Shop, Service, User, Review
from app.schemas.bookings import BookingCreate, BookingOut, BookingStatusUpdate
from app.schemas.payments import ReviewCreate
from app.core.dependencies import get_current_user, require_owner
from app.services.whatsapp_service import (
    notify_booking_confirmed,
    notify_owner_new_booking,
    notify_booking_status_update,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _generate_code() -> str:
    """SAL-XXXX style short human-readable confirmation code."""
    suffix = "".join(random.choices(string.digits, k=4))
    return f"SAL-{suffix}"


# ── POST /bookings ─────────────────────────────────────────────────────────────
@router.post("", response_model=BookingOut, status_code=201)
async def create_booking(
    body: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Validate shop
    shop_res = await db.execute(select(Shop).where(Shop.id == body.shop_id, Shop.status == "active"))
    shop = shop_res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or not active")

    # 2. Validate service
    svc_res = await db.execute(
        select(Service).where(Service.id == body.service_id, Service.shop_id == body.shop_id)
    )
    service = svc_res.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # 3. Check slot is in future
    slot_dt = datetime.combine(body.slot_date, body.slot_time)
    if slot_dt <= datetime.now():
        raise HTTPException(status_code=400, detail="Cannot book a slot in the past")

    # 4. Check for double-booking (same shop + same slot)
    clash_res = await db.execute(
        select(Booking).where(
            and_(
                Booking.shop_id == body.shop_id,
                Booking.slot_date == body.slot_date,
                Booking.slot_time == body.slot_time,
                Booking.status.in_(["pending", "confirmed"]),
            )
        )
    )
    if clash_res.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    # 5. Check customer doesn't have another booking at the same time
    customer_clash = await db.execute(
        select(Booking).where(
            and_(
                Booking.customer_id == current_user.id,
                Booking.slot_date == body.slot_date,
                Booking.slot_time == body.slot_time,
                Booking.status.in_(["pending", "confirmed"]),
            )
        )
    )
    if customer_clash.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You already have a booking at this time")

    # 6. Calculate end time
    from datetime import timedelta
    slot_end_dt = slot_dt + timedelta(minutes=service.duration_minutes)

    # 7. Create booking
    booking = Booking(
        confirmation_code=_generate_code(),
        customer_id=current_user.id,
        shop_id=body.shop_id,
        service_id=body.service_id,
        slot_date=body.slot_date,
        slot_time=body.slot_time,
        slot_end_time=slot_end_dt.time(),
        status="pending",
        payment_status="pending",
        amount_paid=service.price,
        notes=body.notes,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # 8. WhatsApp notifications (fire-and-forget)
    try:
        date_str = body.slot_date.strftime("%d %b %Y")
        time_str = body.slot_time.strftime("%I:%M %p")
        await notify_booking_confirmed(
            current_user.phone, shop.name, service.name,
            date_str, time_str, booking.confirmation_code,
        )
        await notify_owner_new_booking(
            shop.phone, current_user.name, service.name,
            date_str, time_str, booking.confirmation_code,
        )
    except Exception as e:
        logger.warning(f"WhatsApp notify failed: {e}")

    return booking


# ── GET /bookings/my ──────────────────────────────────────────────────────────
@router.get("/my", response_model=list[BookingOut])
async def my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking)
        .where(Booking.customer_id == current_user.id)
        .order_by(Booking.slot_date.desc(), Booking.slot_time.desc())
    )
    return result.scalars().all()


# ── GET /bookings/shop/:id ────────────────────────────────────────────────────
@router.get("/shop/{shop_id}", response_model=list[BookingOut])
async def shop_bookings(
    shop_id: str,
    target_date: date | None = None,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    filters = [Booking.shop_id == shop_id]
    if target_date:
        filters.append(Booking.slot_date == target_date)

    result = await db.execute(
        select(Booking).where(and_(*filters)).order_by(Booking.slot_date, Booking.slot_time)
    )
    return result.scalars().all()


# ── GET /bookings/:id ─────────────────────────────────────────────────────────
@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    # customer sees their own; owner/admin can see all
    if current_user.role == "customer" and booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return booking


# ── PATCH /bookings/:id/status ────────────────────────────────────────────────
@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_booking_status(
    booking_id: str,
    body: BookingStatusUpdate,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = body.status
    await db.commit()
    await db.refresh(booking)

    # Notify customer
    try:
        shop_res = await db.execute(select(Shop).where(Shop.id == booking.shop_id))
        shop = shop_res.scalar_one_or_none()
        cust_res = await db.execute(select(User).where(User.id == booking.customer_id))
        cust = cust_res.scalar_one_or_none()
        if shop and cust:
            await notify_booking_status_update(
                cust.phone, shop.name, body.status,
                booking.slot_time.strftime("%I:%M %p"),
            )
    except Exception as e:
        logger.warning(f"Status notify failed: {e}")

    return booking


# ── DELETE /bookings/:id ──────────────────────────────────────────────────────
@router.delete("/{booking_id}", status_code=204)
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.customer_id != current_user.id and current_user.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    booking.status = "cancelled"
    await db.commit()


# ── POST /bookings/:id/review ─────────────────────────────────────────────────
@router.post("/{booking_id}/review", status_code=201)
async def submit_review(
    booking_id: str,
    body: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Must be completed booking
    bk_res = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = bk_res.scalar_one_or_none()
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed bookings")

    # Check not already reviewed
    existing = await db.execute(
        select(Review).where(
            and_(Review.customer_id == current_user.id, Review.booking_id == booking_id)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already reviewed this booking")

    review = Review(
        customer_id=current_user.id,
        shop_id=booking.shop_id,
        booking_id=booking_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)

    # Update shop avg_rating
    shop_res = await db.execute(select(Shop).where(Shop.id == booking.shop_id))
    shop = shop_res.scalar_one_or_none()
    if shop:
        total = shop.avg_rating * shop.review_count + body.rating
        shop.review_count += 1
        shop.avg_rating = round(total / shop.review_count, 1)

    await db.commit()
    return {"message": "Review submitted"}
