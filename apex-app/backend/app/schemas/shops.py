from decimal import Decimal
from datetime import datetime, date, time
from pydantic import BaseModel, field_validator


# ── Shop ──────────────────────────────────────────────────────────────────────
class ShopCreate(BaseModel):
    name: str
    category: str = "salon"
    description: str | None = None
    address: str
    area: str
    city: str
    phone: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None

    @field_validator("category")
    @classmethod
    def valid_category(cls, v):
        if v not in ("food", "salon", "health"):
            raise ValueError("category must be food, salon, or health")
        return v


class ShopUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    area: str | None = None
    city: str | None = None
    phone: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None


class ShopOut(BaseModel):
    id: str
    owner_id: str
    name: str
    category: str
    description: str | None
    address: str
    area: str
    city: str
    phone: str
    latitude: Decimal | None
    longitude: Decimal | None
    status: str
    avg_rating: Decimal
    review_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ShopListOut(BaseModel):
    id: str
    name: str
    category: str
    area: str
    city: str
    status: str
    avg_rating: Decimal
    review_count: int

    model_config = {"from_attributes": True}


# ── Service ───────────────────────────────────────────────────────────────────
class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    duration_minutes: int
    category: str | None = None


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    duration_minutes: int | None = None
    category: str | None = None
    is_available: bool | None = None


class ServiceOut(BaseModel):
    id: str
    shop_id: str
    name: str
    description: str | None
    price: Decimal
    duration_minutes: int
    category: str | None
    is_available: bool

    model_config = {"from_attributes": True}


# ── Schedule ──────────────────────────────────────────────────────────────────
class ScheduleSet(BaseModel):
    day_of_week: int          # 0=Mon … 6=Sun
    open_time: time
    close_time: time
    is_working_day: bool = True
    buffer_minutes: int = 10
    max_concurrent: int = 1


class BlockDateRequest(BaseModel):
    blocked_date: date
    reason: str | None = None


class SlotOut(BaseModel):
    time: str          # "10:00"
    end_time: str      # "10:30"
    available: bool
