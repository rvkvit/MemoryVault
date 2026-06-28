from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Import all models so their metadata is registered before autogenerate
from app.infrastructure.models import Base  # noqa: F401 (side-effect import)
from app.core.config import settings

config = context.config

# Use the asyncpg-normalised URL from settings so local dev and Neon both work.
config.set_main_option("sqlalchemy.url", settings.async_database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # render_as_batch is SQLite-only; PostgreSQL supports native ALTER TABLE
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # render_as_batch removed — not needed for PostgreSQL
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # Mirror the same SSL logic used in database.py so alembic upgrade head
    # succeeds on Neon (which requires SSL) without a separate configuration.
    ssl_required = settings.DATABASE_SSL or "sslmode=require" in settings.DATABASE_URL
    connect_args: dict = {"ssl": "require"} if ssl_required else {}

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
