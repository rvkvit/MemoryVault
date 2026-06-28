from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Farewell"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_DEBUG: bool = False
    APP_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_HOURS: int = 8
    STATE_HMAC_SECRET: str

    # Microsoft Entra ID (optional — replaced by invitation-based auth)
    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/callback"

    # Invitation-based authentication
    INVITATION_TOKEN_EXPIRE_DAYS: int = 30
    # Generate admin password hash with:
    #   python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"
    ADMIN_PASSWORD_HASH: str = ""

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./farewell.db"

    # Admin access
    ADMIN_EMAILS: str = ""

    # CORS
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"

    # File uploads
    UPLOAD_DIR: str = "./data/uploads"
    UPLOADS_BASE_URL: str = "http://localhost:8000/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Logging
    LOG_LEVEL: str = "INFO"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]

    @field_validator("JWT_SECRET_KEY", "STATE_HMAC_SECRET")
    @classmethod
    def secrets_must_be_long_enough(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("Secret keys must be at least 32 characters long")
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
