"""
FastAPI dependencies for authentication and authorization.

AUTHENTICATION FLOW (two-stage)
---------------------------------
Stage 1 — Token extraction and signature verification (get_current_user):
  The JWT is read from either the Bearer header or the HttpOnly cookie.
  decode_access_token() verifies the HS256 signature and expiry.
  Cost: in-process HMAC computation, no database query.

Stage 2 — Resource authorization (require_recipient_for_slug, require_admin):
  Route-level guards that check the role claim in the decoded JWT.
  The email+recipient_id re-verification against the live database happens
  in the route handler itself (pages.py) — see that module for rationale.

WHY NOT VALIDATE AGAINST DB HERE
----------------------------------
Database-backed authorization at the dependency layer would run on every request
including unauthenticated ones (before we even know the request is valid).
We keep the dependency layer stateless (no DB queries) and push the DB check to
the route handler where we already have the page record loaded.
"""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import Cookie, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, InvalidTokenError, UnauthorizedError
from app.core.security import decode_access_token
from app.domain.enums import UserRole
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# ── Bearer token extractor (optional — falls back to cookie) ──────────────────

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
    session_cookie: Annotated[
        str | None,
        Cookie(alias="__Host-farewell-session"),
    ] = None,
    session_cookie_dev: Annotated[
        str | None,
        Cookie(alias="farewell-session"),
    ] = None,
) -> dict[str, Any]:
    """
    Resolve the authenticated user from a JWT.

    Token precedence:
      1. Authorization: Bearer <token>   — for API clients / Swagger testing
      2. __Host-farewell-session cookie  — browsers in production (HTTPS)
      3. farewell-session cookie         — browsers in development (HTTP)

    WHY THE COOKIE FALLBACK FOR DEV
    ---------------------------------
    The __Host- cookie prefix requires Secure=true, which requires HTTPS.
    In local development (HTTP), the browser will reject the __Host- cookie.
    We accept a plain 'farewell-session' cookie in development to allow testing
    without a local TLS setup. The auth router sets the correct name based on
    settings.is_production.
    """
    token: str | None = (
        credentials.credentials if credentials
        else session_cookie
        or session_cookie_dev
    )

    if not token:
        raise UnauthorizedError("No authentication token provided")

    # decode_access_token validates: HS256 signature, expiry, required claims
    claims = decode_access_token(token)

    # Sanity check required claims — decode_access_token already does this,
    # but we be explicit here to catch any future bypass.
    if not claims.get("email"):
        raise InvalidTokenError("Token missing required 'email' claim")
    if not claims.get("role"):
        raise InvalidTokenError("Token missing required 'role' claim")

    return claims


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> dict[str, Any]:
    """
    Ensures the authenticated user has the ADMIN role.
    Used as a router-level dependency on all /admin/* routes.
    """
    if user.get("role") != UserRole.ADMIN:
        raise ForbiddenError("Admin access required")
    return user


async def require_recipient_for_slug(
    user: CurrentUser,
) -> dict[str, Any]:
    """
    Ensures the authenticated user is either a RECIPIENT or an ADMIN.

    This is a pre-check at the dependency layer. The route handler (pages.py)
    performs the definitive email+recipient_id verification against the database.

    COLLEAGUES ARE DENIED HERE
    ---------------------------
    There is no 'colleague' flow for page viewing. Only the intended recipient
    (email match) and admins can view the full page. This dependency enforces
    that rule before the route handler runs, saving a database query on denials.
    """
    role = user.get("role")

    if role == UserRole.ADMIN:
        return user  # Admins can access any page

    if role == UserRole.RECIPIENT:
        # Further validation (email vs. DB record) happens in the route handler
        return user

    # Colleagues, guests, or any unrecognized role
    raise ForbiddenError(
        "This page is private. Only the intended recipient can view it."
    )


AdminUser = Annotated[dict[str, Any], Depends(require_admin)]
DbSession  = Annotated[AsyncSession, Depends(get_db)]
