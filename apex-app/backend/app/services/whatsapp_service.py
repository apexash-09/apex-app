"""
WhatsApp Notification Service
All messages the system sends — bookings, reminders, order status, admin alerts.
In dev mode: logs to console. In prod: sends via Twilio.
"""

import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


async def _send(phone: str, message: str) -> None:
    """Core send function. All other functions call this."""
    if settings.ENVIRONMENT == "development":
        logger.warning(f"\n📱 WHATSAPP → {phone}\n{message}\n{'─'*40}")
        return
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{phone}",
        )
    except Exception as e:
        logger.error(f"WhatsApp send failed to {phone}: {e}")


# ── Booking messages ──────────────────────────────────────────────────────────
async def notify_booking_confirmed(
    customer_phone: str,
    shop_name: str,
    service_name: str,
    slot_date: str,
    slot_time: str,
    confirmation_code: str,
) -> None:
    msg = (
        f"✅ *Booking Confirmed!*\n\n"
        f"🏪 Shop: {shop_name}\n"
        f"💇 Service: {service_name}\n"
        f"📅 Date: {slot_date}\n"
        f"⏰ Time: {slot_time}\n"
        f"🔖 Code: *{confirmation_code}*\n\n"
        f"Reply CANCEL to cancel your appointment."
    )
    await _send(customer_phone, msg)


async def notify_owner_new_booking(
    owner_phone: str,
    customer_name: str,
    service_name: str,
    slot_date: str,
    slot_time: str,
    confirmation_code: str,
) -> None:
    msg = (
        f"🔔 *New Booking Alert!*\n\n"
        f"👤 Customer: {customer_name or 'Guest'}\n"
        f"💇 Service: {service_name}\n"
        f"📅 Date: {slot_date}\n"
        f"⏰ Time: {slot_time}\n"
        f"🔖 Code: {confirmation_code}\n\n"
        f"Open your dashboard to confirm or reject."
    )
    await _send(owner_phone, msg)


async def notify_booking_reminder(
    customer_phone: str,
    shop_name: str,
    slot_time: str,
    confirmation_code: str,
) -> None:
    msg = (
        f"⏰ *Appointment Reminder*\n\n"
        f"Your appointment at *{shop_name}* is in 2 hours at {slot_time}.\n"
        f"Code: {confirmation_code}\n\n"
        f"See you soon!"
    )
    await _send(customer_phone, msg)


async def notify_booking_status_update(
    customer_phone: str,
    shop_name: str,
    new_status: str,
    slot_time: str,
) -> None:
    if new_status == "confirmed":
        msg = f"✅ *Booking Confirmed* by {shop_name}. See you at {slot_time}!"
    elif new_status == "cancelled":
        msg = f"❌ *Booking Cancelled* — {shop_name} is unable to take your appointment. Please rebook."
    else:
        msg = f"ℹ️ Your booking at {shop_name} has been updated. Status: {new_status}."
    await _send(customer_phone, msg)


# ── Payment messages ──────────────────────────────────────────────────────────
async def notify_payment_received(
    customer_phone: str,
    amount: str,
    confirmation_code: str,
) -> None:
    msg = (
        f"💳 *Payment Received*\n\n"
        f"Amount: ₹{amount}\n"
        f"Booking: {confirmation_code}\n\n"
        f"Thank you! See you at your appointment."
    )
    await _send(customer_phone, msg)


# ── Admin messages ────────────────────────────────────────────────────────────
async def notify_admin_new_shop(
    admin_phone: str,
    shop_name: str,
    area: str,
    category: str,
) -> None:
    msg = (
        f"🏪 *New Shop Registration*\n\n"
        f"Name: {shop_name}\n"
        f"Area: {area}\n"
        f"Category: {category}\n\n"
        f"Login to admin panel to review and approve."
    )
    await _send(admin_phone, msg)


async def notify_shop_approved(owner_phone: str, shop_name: str) -> None:
    msg = (
        f"🎉 *Your shop is LIVE!*\n\n"
        f"*{shop_name}* has been approved and is now visible to customers.\n"
        f"Log in to your dashboard to complete your profile and start accepting bookings."
    )
    await _send(owner_phone, msg)


async def notify_shop_suspended(owner_phone: str, shop_name: str, reason: str) -> None:
    msg = (
        f"⚠️ *Shop Suspended*\n\n"
        f"*{shop_name}* has been temporarily suspended.\n"
        f"Reason: {reason}\n\n"
        f"Contact support for assistance."
    )
    await _send(owner_phone, msg)
