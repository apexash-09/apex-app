from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    shop_id: str
    booking_id: str | None = None
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def valid_rating(cls, v):
        if v not in range(1, 6):
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: str
    customer_id: str
    shop_id: str
    booking_id: str | None
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentCreateOrder(BaseModel):
    booking_id: str
    amount: Decimal


class PaymentVerify(BaseModel):
    booking_id: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class PaymentOut(BaseModel):
    booking_id: str
    razorpay_order_id: str
    amount: Decimal
    currency: str = "INR"
