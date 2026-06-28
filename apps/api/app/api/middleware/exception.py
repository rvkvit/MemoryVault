from __future__ import annotations

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import AppException
from app.core.log import get_logger

logger = get_logger(__name__)


class ExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)

        except AppException as exc:
            logger.warning(
                "Application exception",
                extra={
                    "error_type": exc.error_type,
                    "status_code": exc.status_code,
                    "path": request.url.path,
                },
            )
            return JSONResponse(
                status_code=exc.status_code,
                content=exc.to_dict() | {"instance": str(request.url)},
            )

        except StarletteHTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "type": "https://farewell.contoso.com/errors/http-error",
                    "title": "HTTP Error",
                    "status": exc.status_code,
                    "detail": exc.detail,
                    "instance": str(request.url),
                },
            )

        except Exception as exc:
            logger.error(
                "Unhandled exception",
                extra={"path": request.url.path, "error": str(exc)},
                exc_info=True,
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "type": "https://farewell.contoso.com/errors/internal-error",
                    "title": "Internal Server Error",
                    "status": 500,
                    "detail": "An unexpected error occurred",
                    "instance": str(request.url),
                },
            )


def validation_exception_handler(request: Request, exc: RequestValidationError):
    """FastAPI schema validation → 422 in RFC 9457 shape."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": "https://farewell.contoso.com/errors/validation-error",
            "title": "Validation Error",
            "status": 422,
            "detail": "The request body failed schema validation",
            "instance": str(request.url),
            "errors": exc.errors(),
        },
    )
