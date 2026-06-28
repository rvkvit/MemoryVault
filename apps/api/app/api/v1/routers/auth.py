"""
Authentication router.

Admin login: POST /auth/admin-login  — email + password → session cookie
Logout:      POST /auth/logout       — clears session cookie
Me:          GET  /auth/me           — returns current user profile

COOKIE SECURITY CONFIGURATION
-------------------------------
  Cookie name: __Host-farewell-session (production) / farewell-session (development)

  __Host- prefix rules:
    - Secure=true is mandatory
    - Domain attribute must be absent
    - Path must be "/"
  Combined: prevents subdomain cookie injection attacks.

  HttpOnly=true prevents XSS token theft.
  SameSite=Lax blocks CSRF via cross-site POST.
"""
from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser
from app.api.v1.schemas.invitation import AdminLoginRequest
from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.log import get_logger
from app.core.security import create_access_token

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

_COOKIE_NAME    = "__Host-farewell-session" if settings.is_production else "farewell-session"
_COOKIE_MAX_AGE = settings.JWT_ACCESS_TOKEN_EXPIRE_HOURS * 3600


@router.post(
    "/admin-login",
    summary="Admin email + password login",
    description=(
        "Validates the admin's email and password. On success, sets a "
        "session cookie and returns the user profile."
    ),
)
async def admin_login(body: AdminLoginRequest, response: Response):
    from passlib.hash import bcrypt  # lazy import — only used for admin auth

    email = body.email.lower().strip()

    # Must be a known admin email
    if email not in settings.admin_email_set:
        raise UnauthorizedError("Invalid credentials.")

    # Verify password
    if not settings.ADMIN_PASSWORD_HASH:
        raise UnauthorizedError(
            "Admin password has not been configured. "
            "Set ADMIN_PASSWORD_HASH in your .env file."
        )

    try:
        valid = bcrypt.verify(body.password, settings.ADMIN_PASSWORD_HASH)
    except Exception:
        valid = False

    if not valid:
        raise UnauthorizedError("Invalid credentials.")

    token = create_access_token(
        subject=email,
        email=email,
        name=email.split("@")[0],
        role="admin",
        expire_hours=settings.JWT_ACCESS_TOKEN_EXPIRE_HOURS,
    )

    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        max_age=_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    return {"email": email, "role": "admin"}


@router.post(
    "/logout",
    summary="Invalidate the current session",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(response: Response):
    response.delete_cookie(
        key=_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/me",
    summary="Return the currently authenticated user's profile",
    responses={401: {"description": "Not authenticated"}},
)
async def me(user: CurrentUser):
    return {
        "email":        user.get("email"),
        "name":         user.get("name"),
        "role":         user.get("role"),
        "recipient_id": user.get("recipient_id"),
    }
