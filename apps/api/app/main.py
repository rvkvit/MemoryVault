from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles

from app.api.middleware.exception import ExceptionMiddleware, validation_exception_handler
from app.api.middleware.logging import RequestLoggingMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware
from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.database import engine, init_db
from app.core.log import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(
        "Starting up",
        extra={"app": settings.APP_NAME, "env": settings.APP_ENV},
    )
    await init_db()
    yield
    logger.info("Shutting down")
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "Secure, invite-only farewell web application. "
            "Access is gated by Microsoft Entra ID — only the intended recipient "
            "can view their personalized farewell page."
        ),
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── Middleware (registered in reverse call order — first registered = outermost) ──
    #
    # Execution order (outermost → innermost):
    #   CORSMiddleware → RateLimitMiddleware → RequestLoggingMiddleware → ExceptionMiddleware → route
    #
    # WHY THIS ORDER
    # ---------------
    # CORS runs first so pre-flight OPTIONS requests are answered before any
    # rate-limit or auth logic runs (browsers send OPTIONS without credentials).
    #
    # RateLimitMiddleware runs before logging so that rate-limited requests
    # are rejected fast (no DB activity) and not cluttering the structured log
    # with full request/response cycles for bot traffic.
    #
    # ExceptionMiddleware is innermost so it catches exceptions from route handlers
    # but not from the middleware stack itself (CORS, rate-limit, and logging
    # failures are infrastructure issues and should surface as 500s normally).
    app.add_middleware(ExceptionMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Correlation-ID"],
        expose_headers=["X-Correlation-ID", "X-Response-Time"],
    )

    # ── Exception handlers ─────────────────────────────────────────────────────
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]

    # ── Static file serving for local uploads ─────────────────────────────────
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    # ── Routers ────────────────────────────────────────────────────────────────
    app.include_router(v1_router)

    # ── Health checks ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    @app.get("/health/live", tags=["Health"], include_in_schema=False)
    async def health_live():
        return {"status": "ok"}

    @app.get("/health/ready", tags=["Health"], include_in_schema=False)
    async def health_ready():
        from sqlalchemy import text
        from app.core.database import AsyncSessionFactory
        async with AsyncSessionFactory() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready"}

    # ── Custom OpenAPI schema with bearer security ─────────────────────────────
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        schema["components"]["securitySchemes"] = {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": (
                    "Paste the JWT from the `__Host-farewell-session` cookie, "
                    "or the token returned by the `/auth/callback` endpoint."
                ),
            }
        }
        schema["security"] = [{"BearerAuth": []}]
        app.openapi_schema = schema
        return schema

    app.openapi = custom_openapi  # type: ignore[method-assign]

    return app


app = create_app()
