"""
Admin invitation management endpoints.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.api.v1.schemas.invitation import GenerateInvitationResponse, InvitationStatus
from app.application.services.invitation import InvitationService
from app.application.services.recipient import RecipientService
from app.core.config import settings
from app.core.database import get_db
from app.core import email as email_service

router = APIRouter(
    prefix="/admin/invitations",
    tags=["Admin — Invitations"],
    dependencies=[Depends(require_admin)],
)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/{recipient_id}",
    response_model=InvitationStatus,
    summary="Get current invitation status for a recipient",
)
async def get_invitation_status(
    db: DbDep,
    recipient_id: str = Path(...),
):
    service = InvitationService(db)
    invitation = await service.get_status(recipient_id)

    if not invitation:
        return InvitationStatus(
            exists=False,
            is_activated=False,
            expires_at=None,
            created_at=None,
            invite_url=None,
        )

    device = invitation.trusted_device
    return InvitationStatus(
        exists=True,
        is_activated=invitation.is_activated,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        # The invite URL cannot be reconstructed from the hash alone —
        # the admin must regenerate to get a new link.
        invite_url=None,
        device_browser=device.user_agent if device else None,
        device_first_visit=device.first_visit_at if device else None,
        device_last_visit=device.last_visit_at if device else None,
        device_visit_count=device.visit_count if device else None,
    )


@router.post(
    "/{recipient_id}/generate",
    response_model=GenerateInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate (or regenerate) an invitation link for a recipient",
)
async def generate_invitation(
    db: DbDep,
    recipient_id: str = Path(...),
):
    rec_service = RecipientService(db)
    # Raises NotFoundError if not found — caught by middleware
    recipient = await rec_service.get_by_id(recipient_id)

    service = InvitationService(db)
    invite_url, invitation = await service.generate(recipient)

    await email_service.send_invitation_email(
        to_email=recipient.email,
        to_name=recipient.display_name,
        invite_url=invite_url,
    )

    return GenerateInvitationResponse(
        invite_url=invite_url,
        expires_at=invitation.expires_at,
    )


@router.post(
    "/{recipient_id}/reset-device",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reset the trusted device so the invitation can be activated from a new browser",
)
async def reset_trusted_device(
    db: DbDep,
    recipient_id: str = Path(...),
):
    service = InvitationService(db)
    await service.reset_device(recipient_id)
