"""
Slot Service — calculates available booking slots for a salon on a given date.

Logic:
  1. Fetch the shop's schedule for that day of week
  2. Check if the date is blocked
  3. Generate all possible slots (open_time → close_time, step = duration + buffer)
  4. Cross-check each slot against existing bookings in the DB
  5. Return list of {time, end_time, available}
"""

from datetime import date, time, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.salon import ShopSchedule, BlockedDate, Booking, Service


def _time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _minutes_to_time(m: int) -> time:
    return time(m // 60, m % 60)


async def get_available_slots(
    db: AsyncSession,
    shop_id: str,
    service_id: str,
    target_date: date,
) -> list[dict]:
    """Returns list of slot dicts with 'time', 'end_time', 'available'."""

    # 1. Fetch service duration
    svc_result = await db.execute(select(Service).where(Service.id == service_id))
    service = svc_result.scalar_one_or_none()
    if not service:
        return []

    duration = service.duration_minutes

    # 2. Check if date is blocked
    blocked = await db.execute(
        select(BlockedDate).where(
            and_(BlockedDate.shop_id == shop_id, BlockedDate.blocked_date == target_date)
        )
    )
    if blocked.scalar_one_or_none():
        return []

    # 3. Fetch schedule for that day of week (0=Mon)
    day_of_week = target_date.weekday()
    sched_result = await db.execute(
        select(ShopSchedule).where(
            and_(ShopSchedule.shop_id == shop_id, ShopSchedule.day_of_week == day_of_week)
        )
    )
    schedule = sched_result.scalar_one_or_none()
    if not schedule or not schedule.is_working_day:
        return []

    # 4. Fetch all confirmed bookings for that shop+date
    bookings_result = await db.execute(
        select(Booking.slot_time, Booking.slot_end_time).where(
            and_(
                Booking.shop_id == shop_id,
                Booking.slot_date == target_date,
                Booking.status.in_(["pending", "confirmed"]),
            )
        )
    )
    booked_ranges = [(r.slot_time, r.slot_end_time) for r in bookings_result.fetchall()]

    # 5. Generate slots
    open_min  = _time_to_minutes(schedule.open_time)
    close_min = _time_to_minutes(schedule.close_time)
    step      = duration + schedule.buffer_minutes
    slots     = []

    current = open_min
    while current + duration <= close_min:
        slot_start = _minutes_to_time(current)
        slot_end   = _minutes_to_time(current + duration)

        # Check for collisions with existing bookings
        collision = any(
            not (slot_end <= booked_start or slot_start >= booked_end)
            for booked_start, booked_end in booked_ranges
        )

        # Past slots on today's date are unavailable
        is_past = (
            target_date == date.today()
            and slot_start <= datetime.now().time()
        )

        slots.append({
            "time": slot_start.strftime("%H:%M"),
            "end_time": slot_end.strftime("%H:%M"),
            "available": not collision and not is_past,
        })
        current += step

    return slots
