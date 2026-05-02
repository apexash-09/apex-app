from pydantic import BaseModel, EmailStr


class OwnerRegister(BaseModel):
    phone: str
    email: EmailStr
    name: str
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: str | None = None   # 2FA — optional for now, enforced in prod


class OwnerLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class AdminCreate(BaseModel):
    """Only super-admin can call this to mint new admin accounts."""
    email: EmailStr
    name: str
    password: str
