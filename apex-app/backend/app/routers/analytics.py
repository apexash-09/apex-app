"""
Owner Analytics Router — data the business owner sees in their dashboard.

GET /analytics/overview     — today's bookings, revenue, customers served
GET /analytics/revenue      — revenue chart (day/week/month)
GET /analytics/popular      — most booked services + peak hours
"""

from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, cast, Integer
from sqlalchemy import Date as SADate, Time as SATime

from app.database import get_db
from app.models.salon import Booking, Shop, Service, User
from app.core.dependencies import require_owner

router = APIRouter()


@router.get("/overview")
async def owner_overview(
    shop_id: str,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()

    # Today's bookings
    today_bk = await db.execute(
        select(func.count(Booking.id)).where(
            and_(Booking.shop_id == shop_id, Booking.slot_date == today)
        )
    )
    # Pending confirmations
    pending = await db.execute(
        select(func.count(Booking.id)).where(
            and_(Booking.shop_id == shop_id, Booking.slot_date == today, Booking.status == "pending")
        )
    )
    # Today's revenue (paid)
    revenue = await db.execute(
        select(func.coalesce(func.sum(Booking.amount_paid), 0)).where(
            and_(
                Booking.shop_id == shop_id,
                Booking.slot_date == today,
                Booking.payment_status == "paid",
            )
        )
    )
    # Upcoming next 3 hours
    now = datetime.now()
    in_3h = now + timedelta(hours=3)
    upcoming = await db.execute(
        select(Booking).where(
            and_(
                Booking.shop_id == shop_id,
                Booking.slot_date == today,
                Booking.status.in_(["pending", "confirmed"]),
            )
        ).order_by(Booking.slot_time)
    )

    return {
        "date": str(today),
        "total_bookings_today": today_bk.scalar(),
        "pending_confirmations": pending.scalar(),
        "revenue_today": float(revenue.scalar()),
        "upcoming_bookings": [
            {
                "id": b.id,
                "confirmation_code": b.confirmation_code,
                "service_id": b.service_id,
                "slot_time": str(b.slot_time),
                "status": b.status,
                "amount": float(b.amount_paid),
            }
            for b in upcoming.scalars().all()
        ],
    }


@router.get("/revenue")
async def owner_revenue(
    shop_id: str,
    period: str = Query("month", pattern="^(day|week|month)$"),
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    """Revenue grouped by day for last 7 or 30 days."""
    days = 7 if period == "week" else 30 if period == "month" else 1
    since = datetime.now() - timedelta(days=days)

    result = await db.execute(
        select(
            cast(Booking.created_at, SADate).label("day"),
            func.sum(Booking.amount_paid).label("revenue"),
            func.count(Booking.id).label("bookings"),
        )
        .where(
            and_(
                Booking.shop_id == shop_id,
                Booking.payment_status == "paid",
                Booking.created_at >= since,
            )
        )
        .group_by(cast(Booking.created_at, SADate))
        .order_by(cast(Booking.created_at, SADate))
    )
    rows = result.fetchall()
    return [{"date": str(r.day), "revenue": float(r.revenue or 0), "bookings": r.bookings} for r in rows]


@router.get("/popular")
async def popular_services(
    shop_id: str,
    current_user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    """Top services by booking count + peak hour heatmap."""

    # Top services
    svc_result = await db.execute(
        select(Booking.service_id, func.count(Booking.id).label("count"))
        .where(Booking.shop_id == shop_id)
        .group_by(Booking.service_id)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
    )

    # Peak hours (0-23)
    hour_result = await db.execute(
        select(
            func.extract("hour", Booking.slot_time).label("hour"),
            func.count(Booking.id).label("count"),
        )
        .where(Booking.shop_id == shop_id)
        .group_by(func.extract("hour", Booking.slot_time))
        .order_by(func.extract("hour", Booking.slot_time))
    )

    return {
        "top_services": [
            {"service_id": r.service_id, "bookings": r.count}
            for r in svc_result.fetchall()
        ],
        "peak_hours": [
            {"hour": int(r.hour), "bookings": r.count}
            for r in hour_result.fetchall()
        ],
    }
