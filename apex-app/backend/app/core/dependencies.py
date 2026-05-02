"""
FastAPI dependencies injected into route functions.

Usage in a route:
    @router.get("/me")
    async def get_me(current_user: User = Depends(get_current_user)):
        ...

    @router.post("/admin/approve")
    async def approve(admin: User = Depends(require_admin)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.jwt import decode_access_token
from app.database import get_db
from app.models.salon import User

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validates JWT and returns the logged-in User object."""
    payload = decode_access_token(credentials.credentials)
    user_id: str = payload.get("sub")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Phone not verified")

    return user


def require_role(*roles: str):
    """Factory: returns a dependency that enforces one of the given roles."""
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {' or '.join(roles)}",
            )
        return current_user
    return _check


# Convenience shortcuts
require_customer = require_role("customer", "owner", "admin")  # any logged-in user
require_owner    = require_role("owner", "admin")
require_admin    = require_role("admin")
