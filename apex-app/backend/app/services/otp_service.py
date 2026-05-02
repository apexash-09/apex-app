"""
OTP Service — generates, stores, verifies, and delivers one-time passwords.

Storage: Redis key  otp:{phone}  with 5-minute TTL (auto-expires).
Rate limit: Redis key  otp_count:{phone}  max 5 per hour.
Delivery: Twilio WhatsApp API (dev: prints to console).
"""

import random
import logging
from datetime import timedelta

import redis.asyncio as aioredis
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Redis client (shared, created once) ───────────────────────────────────────
redis_client: aioredis.Redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

OTP_TTL_SECONDS = 300        # 5 minutes
OTP_RATE_LIMIT = 5           # max OTPs per phone per hour
OTP_RATE_WINDOW_SECONDS = 3600


def _generate_otp() -> str:
    return str(random.randint(100000, 999999))


# ── Send OTP ──────────────────────────────────────────────────────────────────
async def send_otp(phone: str) -> None:
    """Generate OTP, store in Redis, and deliver via WhatsApp."""

    # 1. Rate limiting
    rate_key = f"otp_count:{phone}"
    count = await redis_client.get(rate_key)
    if count and int(count) >= OTP_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Try again in an hour.",
        )

    # 2. Generate and store
    otp = _generate_otp()
    otp_key = f"otp:{phone}"
    await redis_client.setex(otp_key, OTP_TTL_SECONDS, otp)

    # 3. Increment rate counter
    pipe = redis_client.pipeline()
    pipe.incr(rate_key)
    pipe.expire(rate_key, OTP_RATE_WINDOW_SECONDS)
    await pipe.execute()

    # 4. Deliver
    await _deliver_otp(phone, otp)


async def _deliver_otp(phone: str, otp: str) -> None:
    message = (
        f"Your Apex App OTP is *{otp}*.\n"
        f"Valid for 5 minutes. Do not share this code with anyone."
    )

    if settings.ENVIRONMENT == "development":
        # In dev: just log it — no real WhatsApp call
        logger.warning(f"[DEV OTP] {phone} → {otp}")
        return

    # Production: send via Twilio
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{phone}",
        )
    except Exception as e:
        logger.error(f"WhatsApp OTP delivery failed for {phone}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send OTP. Please try again.",
        )


# ── Verify OTP ────────────────────────────────────────────────────────────────
async def verify_otp(phone: str, submitted_otp: str) -> bool:
    """
    Returns True if OTP matches. Deletes from Redis on success (one-time use).
    Raises HTTPException on mismatch or expiry.
    """
    otp_key = f"otp:{phone}"
    stored = await redis_client.get(otp_key)

    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or not requested. Please request a new one.",
        )

    if stored != submitted_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP. Please try again.",
        )

    # Delete immediately — one-time use
    await redis_client.delete(otp_key)
    return True
