from __future__ import annotations

from typing import Any


class AppException(Exception):
    """Base class for all application-level exceptions."""

    status_code: int = 500
    error_type: str = "internal-error"
    default_message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None, detail: Any = None) -> None:
        self.message = message or self.default_message
        self.detail = detail
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "type": f"https://farewell.contoso.com/errors/{self.error_type}",
            "title": self._title(),
            "status": self.status_code,
            "detail": self.message,
        }
        if self.detail is not None:
            payload["extra"] = self.detail
        return payload

    def _title(self) -> str:
        return " ".join(word.capitalize() for word in self.error_type.split("-"))


class NotFoundError(AppException):
    status_code = 404
    error_type = "not-found"
    default_message = "The requested resource was not found"


class ForbiddenError(AppException):
    status_code = 403
    error_type = "forbidden"
    default_message = "You do not have permission to access this resource"


class IdentityMismatchError(AppException):
    """Raised when the authenticated identity does not match the intended recipient."""
    status_code = 403
    error_type = "identity-mismatch"
    default_message = (
        "The authenticated identity does not match the intended recipient for this page"
    )


class UnauthorizedError(AppException):
    status_code = 401
    error_type = "unauthorized"
    default_message = "Authentication is required"


class ValidationError(AppException):
    status_code = 422
    error_type = "validation-error"
    default_message = "The request payload failed validation"


class ConflictError(AppException):
    status_code = 409
    error_type = "conflict"
    default_message = "The resource already exists or conflicts with existing state"


class OAuthError(AppException):
    status_code = 400
    error_type = "oauth-error"
    default_message = "The OAuth flow encountered an error"


class TokenExpiredError(AppException):
    status_code = 401
    error_type = "token-expired"
    default_message = "The authentication token has expired"


class InvalidTokenError(AppException):
    status_code = 401
    error_type = "invalid-token"
    default_message = "The authentication token is invalid"


class RateLimitError(AppException):
    status_code = 429
    error_type = "rate-limit-exceeded"
    default_message = "Too many requests. Please try again later"


class PageNotPublishedError(AppException):
    status_code = 403
    error_type = "page-not-published"
    default_message = "This farewell page has not been published yet"
