from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    app_name: str = "PropPilot AI"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"

    api_v1_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = Field(..., validation_alias="DATABASE_URL")
    supabase_url: str = Field(..., validation_alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., validation_alias="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(..., validation_alias="SUPABASE_SERVICE_KEY")
    supabase_jwt_secret: str = Field(..., validation_alias="SUPABASE_JWT_SECRET")

    secret_key: str = Field(..., validation_alias="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    refresh_token_expire_days: int = 30

    google_api_key: str = Field(..., validation_alias="GOOGLE_API_KEY")
    gemini_model: str = "gemini-2.0-flash"
    gemini_temperature: float = 0.7

    langgraph_checkpoint_type: str = "memory"

    redis_url: str = "redis://localhost:6379/0"

    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@proppilot.ai"
    from_email: str = "noreply@proppilot.ai"

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    whatsapp_phone_number_id: str = ""
    whatsapp_access_token: str = ""
    whatsapp_verify_token: str = ""

    frontend_url: str = "https://proppilot-ai-v2.vercel.app"
    cors_origins: List[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://proppilot-ai-v2.vercel.app",
    "https://proppilot-ai-v2-qcvv2ccm4-team-vison-x.vercel.app",
]

    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    sentry_dsn: str = ""
    prometheus_enabled: bool = False

    log_level: str = "INFO"
    log_format: str = "json"

    max_file_size: int = 10485760
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"


settings = Settings()