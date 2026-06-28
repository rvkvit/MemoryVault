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

    # Database — Neon PostgreSQL (or any PostgreSQL-compatible URL).
    # Paste the connection string from Neon as-is; the +asyncpg driver and
    # SSL handling are applied automatically by async_database_url below.
    DATABASE_URL: str = "postgresql+asyncpg://localhost/farewell"
    # Set to true for Neon / any remote PostgreSQL that requires SSL.
    DATABASE_SSL: bool = False

    # Cloudinary — cloud storage for images, videos, and voice recordings.
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Admin access
    ADMIN_EMAILS: str = ""

    # CORS
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"

    # File upload size limit (enforced before sending to Cloudinary)
    MAX_UPLOAD_SIZE_MB: int = 50

    # Logging
    LOG_LEVEL: str = "INFO"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def async_database_url(self) -> str:
        """Return a postgresql+asyncpg:// URL, normalising common variants.

        Neon connection strings start with postgres:// or postgresql:// and
        contain ?sslmode=require. asyncpg does not parse sslmode from the URL;
        we strip it here and honour DATABASE_SSL via connect_args instead.
        """
        url = self.DATABASE_URL
        # Strip sslmode query parameter (asyncpg uses connect_args for SSL)
        for token in ("?sslmode=require", "&sslmode=require",
                      "?sslmode=verify-full", "&sslmode=verify-full"):
            url = url.replace(token, "")
        # Ensure the asyncpg driver prefix is present
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

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
