"""
Public invitation endpoint — no auth required.

The invitation URL format is: {BACKEND_URL}/api/v1/invite/{token}

Flow:
  1. Check if the visitor has a valid device cookie → if yes, issue a fresh
     session JWT and redirect (returning visitor on same browser).
  2. Otherwise, validate the raw token:
     - Not found or expired → redirect to /denied?reason=invalid-invitation
     - Already activated     → redirect to /denied?reason=device-already-activated
     - Valid                 → activate, set session + device cookies, redirect.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.invitation import InvitationService
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.log import get_logger
from app.core.security import create_access_token, hash_token
from app.infrastructure.repositories.invitation import InvitationRepository

logger = get_logger(__name__)
router = APIRouter(prefix="/invite", tags=["Invitation"])

_SESSION_COOKIE = "__Host-farewell-session" if settings.is_production else "farewell-session"
_DEVICE_COOKIE  = "__Host-farewell-device"  if settings.is_production else "farewell-device"
_COOKIE_MAX_AGE = settings.INVITATION_TOKEN_EXPIRE_DAYS * 24 * 3600

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/{token}",
    summary="Validate an invitation token and start a session",
    response_class=RedirectResponse,
)
async def redeem_invitation(token: str, request: Request, db: DbDep):
    service = InvitationService(db)
    inv_repo = InvitationRepository(db)

    user_agent = request.headers.get("user-agent", "")
    accept_lang = request.headers.get("accept-language", "")

    # ── Check for returning visitor (device cookie present) ──────────────────
    raw_device = request.cookies.get(_DEVICE_COOKIE)
    if raw_device:
        # Identify which invitation this token belongs to (need recipient_id)
        token_hash = hash_token(token)
        invitation = await inv_repo.get_by_token_hash(token_hash)

        if invitation and invitation.is_activated:
            recipient = await service.validate_device_cookie(raw_device, invitation.recipient_id)
            if recipient:
                # Returning visitor — issue fresh session JWT
                jwt_token = create_access_token(
                    subject=recipient.email,
                    email=recipient.email,
                    name=recipient.display_name,
                    role="recipient",
                    recipient_id=recipient.id,
                    slug=recipient.slug,
                    expire_hours=settings.INVITATION_TOKEN_EXPIRE_DAYS * 24,
                )
                response = RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/to/{recipient.slug}",
                    status_code=302,
                )
                _set_session_cookie(response, jwt_token)
                return response

    # ── First visit — validate and activate the invitation ───────────────────
    try:
        jwt_token, raw_device_token, recipient = await service.validate_and_activate(
            raw_token=token,
            user_agent=user_agent,
            accept_language=accept_lang,
        )
    except NotFoundError:
        logger.info("Invalid or expired invitation token")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/denied?reason=invalid-invitation",
            status_code=302,
        )
    except ForbiddenError:
        # Already activated on another device — do not reveal the recipient
        logger.info("Invitation already activated on another device")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/denied?reason=device-already-activated",
            status_code=302,
        )

    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/to/{recipient.slug}",
        status_code=302,
    )
    _set_session_cookie(response, jwt_token)
    _set_device_cookie(response, raw_device_token)
    return response


def _set_session_cookie(response: RedirectResponse, token: str) -> None:
    response.set_cookie(
        key=_SESSION_COOKIE,
        value=token,
        max_age=_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )


def _set_device_cookie(response: RedirectResponse, raw_device_token: str) -> None:
    response.set_cookie(
        key=_DEVICE_COOKIE,
        value=raw_device_token,
        max_age=_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
