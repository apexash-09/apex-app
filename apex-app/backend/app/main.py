"""
Apex Local Super-App — FastAPI Backend
Phase 1: Salon Vertical — Complete
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Apex Local Super-App API",
    description="Booking platform for local neighbourhood businesses — Salon Vertical",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, shops, bookings, payments, admin, analytics, owner_auth

app.include_router(auth.router,       prefix="/auth",       tags=["Customer Auth"])
app.include_router(owner_auth.router, prefix="/owner/auth", tags=["Owner Auth"])
app.include_router(admin.router,      prefix="/admin",      tags=["Admin"])
app.include_router(shops.router,      prefix="/shops",      tags=["Shops"])
app.include_router(bookings.router,   prefix="/bookings",   tags=["Bookings"])
app.include_router(payments.router,   prefix="/payments",   tags=["Payments"])
app.include_router(analytics.router,  prefix="/analytics",  tags=["Analytics"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": "Apex API", "version": "1.0.0", "environment": settings.ENVIRONMENT}
