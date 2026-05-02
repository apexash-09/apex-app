from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    MONGODB_URL: str
    REDIS_URL: str

    # Auth
    JWT_SECRET_KEY: str
    JWT_REFRESH_SECRET: str
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # Twilio / WhatsApp
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # File Storage
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "apex-app-media"
    R2_ENDPOINT_URL: str = ""

    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    PLATFORM_COMMISSION_PERCENT: float = 8.0

    class Config:
        env_file = ".env"


settings = Settings()
