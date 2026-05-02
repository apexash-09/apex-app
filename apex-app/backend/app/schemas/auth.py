"""
Auth schemas — defines exact JSON shapes for every auth request and response.
Pydantic validates incoming data automatically; FastAPI uses these for docs.
"""

from pydantic import BaseModel, field_validator
import re


# ── Shared validators ─────────────────────────────────────────────────────────
def validate_indian_phone(v: str) -> str:
    """Accepts +919876543210 or 9876543210 — normalises to +91XXXXXXXXXX."""
    digits = re.sub(r"\D", "", v)
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    if len(digits) == 10 and digits[0] in "6789":
        return f"+91{digits}"
    raise ValueError("Enter a valid 10-digit Indian mobile number")


# ── Request bodies ────────────────────────────────────────────────────────────
class SendOTPRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def normalise_phone(cls, v: str) -> str:
        return validate_indian_phone(v)


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: str | None = None   # optional — captured on first login to set display name

    @field_validator("phone")
    @classmethod
    def normalise_phone(cls, v: str) -> str:
        return validate_indian_phone(v)

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit number")
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Response bodies ───────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: str
    phone: str
    name: str | None
    role: str
    is_verified: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageResponse(BaseModel):
    message: str
    expires_in: int | None = None   # seconds until OTP expires
