from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.core.log import get_logger

logger = get_logger(__name__)

_connect_args: dict = {}
if settings.DATABASE_SSL:
    # asyncpg does not honour sslmode in the URL; pass ssl via connect_args.
    _connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.APP_DEBUG,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a database session per request."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Verify the database connection at application startup."""
    from sqlalchemy import text

    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info(
            "Database connection established",
            extra={"driver": settings.async_database_url.split(":")[0]},
        )
    except Exception as exc:
        logger.error("Database connection failed", extra={"error": str(exc)})
        raise
