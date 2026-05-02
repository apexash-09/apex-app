from decimal import Decimal
from datetime import datetime, date, time
from pydantic import BaseModel


class BookingCreate(BaseModel):
    shop_id: str
    service_id: str
    slot_date: date
    slot_time: time
    notes: str | None = None


class BookingStatusUpdate(BaseModel):
    status: str   # confirmed | completed | cancelled | no_show

    def validate_status(self):
        allowed = {"confirmed", "completed", "cancelled", "no_show"}
        if self.status not in allowed:
            raise ValueError(f"status must be one of {allowed}")


class BookingOut(BaseModel):
    id: str
    confirmation_code: str
    customer_id: str
    shop_id: str
    service_id: str
    slot_date: date
    slot_time: time
    slot_end_time: time
    status: str
    payment_status: str
    amount_paid: Decimal
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
