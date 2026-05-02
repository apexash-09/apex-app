"""
Payments Router
POST /payments/create-order   — create Razorpay order for a booking
POST /payments/verify         — verify signature, mark booking paid
GET  /payments/history        — payment history for current user
"""

import hmac
import hashlib
import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.salon import Booking, User
from app.schemas.payments import PaymentCreateOrder, PaymentVerify, PaymentOut
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.services.whatsapp_service import notify_payment_received

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create-order", response_model=PaymentOut)
async def create_payment_order(
    body: PaymentCreateOrder,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == body.booking_id))
    booking = result.scalar_one_or_none()
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")

    if settings.ENVIRONMENT == "development":
        # Return a mock Razorpay order in dev
        return PaymentOut(
            booking_id=body.booking_id,
            razorpay_order_id=f"order_dev_{body.booking_id[:8]}",
            amount=booking.amount_paid,
        )

    try:
        import razorpay
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        amount_paise = int(booking.amount_paid * 100)  # Razorpay needs paise
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": booking.id,
        })
        return PaymentOut(
            booking_id=body.booking_id,
            razorpay_order_id=order["id"],
            amount=booking.amount_paid,
        )
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=503, detail="Payment service unavailable")


@router.post("/verify")
async def verify_payment(
    body: PaymentVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cryptographic signature verification — CRITICAL security step.
    Prevents fake payment confirmations from reaching the backend.
    """
    result = await db.execute(select(Booking).where(Booking.id == body.booking_id))
    booking = result.scalar_one_or_none()
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if settings.ENVIRONMENT != "development":
        # Verify Razorpay HMAC-SHA256 signature
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, body.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment signature invalid")

    # Mark as paid
    booking.payment_status = "paid"
    booking.razorpay_payment_id = body.razorpay_payment_id
    await db.commit()

    # Notify customer
    try:
        await notify_payment_received(
            current_user.phone,
            str(booking.amount_paid),
            booking.confirmation_code,
        )
    except Exception:
        pass

    return {"message": "Payment verified", "booking_id": booking.id}


@router.get("/history")
async def payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking).where(
            Booking.customer_id == current_user.id,
            Booking.payment_status == "paid",
        )
    )
    bookings = result.scalars().all()
    return [
        {
            "booking_id": b.id,
            "confirmation_code": b.confirmation_code,
            "amount": b.amount_paid,
            "date": b.slot_date,
            "payment_id": b.razorpay_payment_id,
        }
        for b in bookings
    ]
