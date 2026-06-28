"""
Pages router — serves the personalized farewell page content.

AUTHORIZATION DESIGN — TWO LAYERS
------------------------------------
Layer 1 (JWT validity, deps.py):
  require_recipient_for_slug() verifies the JWT is signed, unexpired, and has
  a role of RECIPIENT or ADMIN. No database query. O(1).

Layer 2 (resource-level check, this file):
  After loading the page from the database, we re-verify that the email in the
  JWT exactly matches recipient.email for the requested slug.

WHY TWO LAYERS?
  The access token is issued once (at callback time) and cached in a cookie for
  8 hours. If an admin creates a recipient record with the wrong email after
  the token was issued, the token check alone would not catch the mismatch.
  Re-checking the email against the live database at every page request ensures
  the access control decision is always based on current data.

INFORMATION LEAKAGE — 403 VS 404 FOR RECIPIENT ROLE
------------------------------------------------------
If a RECIPIENT-role JWT requests /pages/wrong-slug, the page lookup returns None.
We raise ForbiddenError (403), NOT NotFoundError (404). This is intentional:
  - 404 would reveal that the slug doesn't exist.
  - 403 is indistinguishable from "slug exists but you're not the right person".
  - An attacker who somehow obtains a recipient JWT for one page cannot use it to
    enumerate other valid slugs by observing 403 vs 404 responses.

Admins see the real 404 because they are trusted and need accurate error messages
for page management.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, require_recipient_for_slug
from app.api.v1.schemas.page import FarewellPageResponse, PageOut
from app.api.v1.schemas.recipient import RecipientOut
from app.application.services.page import PageService
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.log import get_logger
from app.domain.enums import UserRole

logger = get_logger(__name__)
router = APIRouter(prefix="/pages", tags=["Pages"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/{slug}",
    response_model=FarewellPageResponse,
    summary="Retrieve a personalized farewell page",
    description=(
        "Returns the full page payload for the recipient identified by `slug`. "
        "The authenticated user must be the intended recipient (email must match) "
        "or an admin. View count is incremented in the background.\n\n"
        "**Security note:** For RECIPIENT-role tokens, the response is 403 for both "
        "'wrong slug' and 'wrong identity' — the two cases are deliberately indistinguishable."
    ),
    responses={
        403: {"description": "Identity mismatch, page not published, or slug access denied"},
        404: {"description": "Recipient or page not found (admin only)"},
    },
)
async def get_page(
    background_tasks: BackgroundTasks,
    db: DbDep,
    slug: str = Path(..., description="Recipient slug from the invitation link"),
    user: dict = Depends(require_recipient_for_slug),
):
    role = user.get("role")
    service = PageService(db)

    try:
        page = await service.get_by_slug(slug)
    except NotFoundError:
        if role == UserRole.ADMIN:
            raise  # Admins see the real 404 — they need accurate diagnostics
        # For recipients: 403 regardless of whether the slug exists.
        # See module docstring for the rationale.
        raise ForbiddenError(
            "Access to this page is restricted. "
            "Ensure you are signed in with the correct account."
        )

    # ── Email re-verification (defense-in-depth layer 2) ─────────────────────
    #
    # We re-check the email from the JWT against the live database record.
    # This catches edge cases where:
    #   - A recipient's email was changed in the database after the JWT was issued.
    #   - The JWT was incorrectly issued (bug, misconfiguration).
    #   - A recipient_id collision or data integrity issue occurred.
    #
    # The comparison is against lowercased versions of both sides to be robust
    # against normalization inconsistencies (see auth service for full rationale).

    if role == UserRole.RECIPIENT:
        jwt_email      = (user.get("email") or "").lower().strip()
        intended_email = page.recipient.email.lower().strip()

        if jwt_email != intended_email:
            logger.warning(
                "JWT email / recipient email mismatch at page access",
                extra={"slug": slug},
                # We do NOT log either email at warning level to avoid PII in log streams.
                # The access_attempts table holds the full audit trail.
            )
            raise ForbiddenError(
                "The authenticated identity does not match the intended recipient."
            )

        # Recipient_id double-check — belt and suspenders
        jwt_recipient_id = user.get("recipient_id")
        if jwt_recipient_id != page.recipient_id:
            logger.warning("JWT recipient_id / page recipient_id mismatch", extra={"slug": slug})
            raise ForbiddenError(
                "The authenticated identity does not match the intended recipient."
            )

    # ── View count (non-blocking) ─────────────────────────────────────────────
    # Pass only page_id — the background task creates its own session so it
    # doesn't race with get_db()'s commit/close on the request session.
    background_tasks.add_task(_increment_view, page.id)

    return FarewellPageResponse(
        recipient=RecipientOut.model_validate(page.recipient),
        page=PageOut.model_validate(page),
    )


async def _increment_view(page_id: str) -> None:
    from app.core.database import AsyncSessionFactory
    async with AsyncSessionFactory() as session:
        service = PageService(session)
        await service.increment_view(page_id)
        await session.commit()
