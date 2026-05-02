"""
Database models for the Apex Local Super-App — Salon Vertical (Phase 1)
Every table maps directly to the blueprint's database design section.
"""

import uuid
from datetime import datetime, date, time
from decimal import Decimal

from sqlalchemy import (
    String, Text, Boolean, Integer, SmallInteger,
    Numeric, Date, Time, DateTime, Enum as SAEnum,
    ForeignKey, UniqueConstraint, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


# ── Helpers ────────────────────────────────────────────────────────────────────
def new_uuid() -> str:
    return str(uuid.uuid4())


# ══════════════════════════════════════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=new_uuid
    )
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role: Mapped[str] = mapped_column(
        SAEnum("customer", "owner", "admin", name="user_role"),
        nullable=False,
        default="customer",
    )
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)  # NULL for OTP-only
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    shops: Mapped[list["Shop"]] = relationship("Shop", back_populates="owner")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="customer")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="customer")

    def __repr__(self) -> str:
        return f"<User {self.phone} [{self.role}]>"


# ══════════════════════════════════════════════════════════════════════════════
# SHOPS
# ══════════════════════════════════════════════════════════════════════════════
class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(
        SAEnum("food", "salon", "health", name="shop_category"),
        nullable=False,
        default="salon",
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    area: Mapped[str] = mapped_column(String(50), nullable=False)   # locality for filtering
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    phone: Mapped[str] = mapped_column(String(15), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "active", "suspended", name="shop_status"),
        nullable=False,
        default="pending",   # admin must approve before going live
    )
    avg_rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="shops")
    services: Mapped[list["Service"]] = relationship("Service", back_populates="shop")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="shop")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="shop")
    schedule: Mapped[list["ShopSchedule"]] = relationship("ShopSchedule", back_populates="shop")
    blocked_dates: Mapped[list["BlockedDate"]] = relationship("BlockedDate", back_populates="shop")

    __table_args__ = (
        Index("ix_shops_area_category", "area", "category"),
        Index("ix_shops_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Shop {self.name} [{self.status}]>"


# ══════════════════════════════════════════════════════════════════════════════
# SERVICES  (haircut, facial, manicure etc.)
# ══════════════════════════════════════════════════════════════════════════════
class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    shop_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # for slot calc
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)  # haircare, skincare...
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shop: Mapped["Shop"] = relationship("Shop", back_populates="services")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="service")

    def __repr__(self) -> str:
        return f"<Service {self.name} Rs.{self.price} ({self.duration_minutes}min)>"


# ══════════════════════════════════════════════════════════════════════════════
# SHOP SCHEDULE  (weekly working hours)
# ══════════════════════════════════════════════════════════════════════════════
class ShopSchedule(Base):
    """Defines open/close times per day of week. 0=Monday … 6=Sunday."""
    __tablename__ = "shop_schedules"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    shop_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 0-6
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_working_day: Mapped[bool] = mapped_column(Boolean, default=True)
    buffer_minutes: Mapped[int] = mapped_column(SmallInteger, default=10)  # gap between slots
    max_concurrent: Mapped[int] = mapped_column(SmallInteger, default=1)   # chairs/staff

    shop: Mapped["Shop"] = relationship("Shop", back_populates="schedule")

    __table_args__ = (
        UniqueConstraint("shop_id", "day_of_week", name="uq_shop_day"),
    )


# ══════════════════════════════════════════════════════════════════════════════
# BLOCKED DATES  (holidays, leaves)
# ══════════════════════════════════════════════════════════════════════════════
class BlockedDate(Base):
    __tablename__ = "blocked_dates"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    shop_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False
    )
    blocked_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(100), nullable=True)

    shop: Mapped["Shop"] = relationship("Shop", back_populates="blocked_dates")

    __table_args__ = (
        UniqueConstraint("shop_id", "blocked_date", name="uq_shop_blocked_date"),
    )


# ══════════════════════════════════════════════════════════════════════════════
# BOOKINGS
# ══════════════════════════════════════════════════════════════════════════════
class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    confirmation_code: Mapped[str] = mapped_column(
        String(8), unique=True, nullable=False
    )  # e.g. SAL-7842 — generated in service layer
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    shop_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("shops.id", ondelete="RESTRICT"), nullable=False
    )
    service_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("services.id", ondelete="RESTRICT"), nullable=False
    )
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    slot_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_end_time: Mapped[time] = mapped_column(Time, nullable=False)  # slot_time + duration
    status: Mapped[str] = mapped_column(
        SAEnum(
            "pending", "confirmed", "completed", "cancelled", "no_show",
            name="booking_status",
        ),
        nullable=False,
        default="pending",
    )
    payment_status: Mapped[str] = mapped_column(
        SAEnum("pending", "paid", "refunded", name="booking_payment_status"),
        nullable=False,
        default="pending",
    )
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    customer: Mapped["User"] = relationship("User", back_populates="bookings")
    shop: Mapped["Shop"] = relationship("Shop", back_populates="bookings")
    service: Mapped["Service"] = relationship("Service", back_populates="bookings")

    __table_args__ = (
        # Prevents double-booking: same shop + same slot can't have two active bookings
        Index("ix_bookings_slot_lookup", "shop_id", "slot_date", "slot_time"),
        Index("ix_bookings_customer", "customer_id"),
    )

    def __repr__(self) -> str:
        return f"<Booking {self.confirmation_code} [{self.status}]>"


# ══════════════════════════════════════════════════════════════════════════════
# REVIEWS
# ══════════════════════════════════════════════════════════════════════════════
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    shop_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False
    )
    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True
    )  # nullable: review tied to completed booking
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1-5
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer: Mapped["User"] = relationship("User", back_populates="reviews")
    shop: Mapped["Shop"] = relationship("Shop", back_populates="reviews")

    __table_args__ = (
        # One review per booking
        UniqueConstraint("customer_id", "booking_id", name="uq_review_per_booking"),
        Index("ix_reviews_shop", "shop_id"),
    )
