from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.security import create_access_token, generate_invitation_token, hash_token
from app.infrastructure.models.invitation import InvitationToken, TrustedDevice
from app.infrastructure.repositories.invitation import InvitationRepository, TrustedDeviceRepository

if TYPE_CHECKING:
    from app.infrastructure.models.recipient import Recipient


class InvitationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._inv_repo = InvitationRepository(db)
        self._dev_repo = TrustedDeviceRepository(db)

    def _invitation_url(self, raw_token: str) -> str:
        return f"{settings.APP_BASE_URL}/api/v1/invite/{raw_token}"

    async def generate(self, recipient: "Recipient") -> tuple[str, InvitationToken]:
        """
        Create a new invitation for a recipient, replacing any existing one.
        Returns (invite_url, invitation).
        """
        existing = await self._inv_repo.get_by_recipient(recipient.id)
        next_generation = 1
        if existing:
            next_generation = existing.generation_count + 1
            # Remove the old invitation (and its trusted device via cascade)
            await self._inv_repo.delete(existing)

        raw_token, token_hash = generate_invitation_token()
        now = datetime.now(timezone.utc)
        invitation = InvitationToken(
            recipient_id=recipient.id,
            token_hash=token_hash,
            is_activated=False,
            activated_at=None,
            expires_at=now + timedelta(days=settings.INVITATION_TOKEN_EXPIRE_DAYS),
            created_at=now,
            generation_count=next_generation,
        )
        await self._inv_repo.create(invitation)
        return self._invitation_url(raw_token), invitation

    async def get_status(self, recipient_id: str) -> InvitationToken | None:
        return await self._inv_repo.get_by_recipient(recipient_id)

    async def validate_and_activate(
        self,
        raw_token: str,
        user_agent: str,
        accept_language: str,
    ) -> tuple[str, str, "Recipient"]:
        """
        Validate an invitation token and issue a session JWT + device token.

        Returns (session_jwt, device_token, recipient).
        Raises ForbiddenError if already activated on another device,
        NotFoundError if token does not exist or is expired.
        """
        token_hash = hash_token(raw_token)
        invitation = await self._inv_repo.get_by_token_hash(token_hash)

        if not invitation:
            raise NotFoundError("Invitation not found or has expired.")

        now = datetime.now(timezone.utc)

        # Check expiry
        expires = invitation.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now > expires:
            raise ForbiddenError("This invitation has expired.")

        # If already activated, only allow the same device (via TrustedDevice)
        if invitation.is_activated:
            # The calling endpoint checks device cookie separately before
            # arriving here — if we reach this point on an activated token
            # the caller has confirmed there is no valid device cookie.
            raise ForbiddenError(
                "This invitation has already been activated on another device."
            )

        recipient = invitation.recipient

        # Mark activated
        invitation.is_activated = True
        invitation.activated_at = now
        await self._inv_repo.update(invitation)

        # Create device fingerprint
        fingerprint_raw = f"{user_agent}|{accept_language}"
        fingerprint_hash = hashlib.sha256(fingerprint_raw.encode()).hexdigest()

        # Generate opaque device token
        import secrets
        raw_device = secrets.token_urlsafe(32)
        device_token_hash = hashlib.sha256(raw_device.encode()).hexdigest()

        device = TrustedDevice(
            invitation_id=invitation.id,
            recipient_id=recipient.id,
            device_token_hash=device_token_hash,
            fingerprint_hash=fingerprint_hash,
            first_visit_at=now,
            last_visit_at=now,
            visit_count=1,
            user_agent=user_agent[:500] if user_agent else None,
        )
        await self._dev_repo.create(device)

        # Issue JWT — 30-day lifetime matching invitation expiry
        jwt_token = create_access_token(
            subject=recipient.email,
            email=recipient.email,
            name=recipient.display_name,
            role="recipient",
            recipient_id=recipient.id,
            slug=recipient.slug,
            expire_hours=settings.INVITATION_TOKEN_EXPIRE_DAYS * 24,
        )

        return jwt_token, raw_device, recipient

    async def validate_device_cookie(
        self, raw_device_token: str, recipient_id: str
    ) -> "Recipient | None":
        """
        Recognize a returning visitor by their device cookie.
        Returns the Recipient if the device is trusted and belongs to the recipient.
        """
        device_hash = hashlib.sha256(raw_device_token.encode()).hexdigest()
        device = await self._dev_repo.get_by_device_hash(device_hash)

        if device is None or device.recipient_id != recipient_id:
            return None

        # Update last seen
        await self._dev_repo.record_visit(device)

        # Return the recipient from the invitation relationship
        return device.invitation.recipient

    async def reset_device(self, recipient_id: str) -> None:
        """
        Admin action: reset the trusted device so the recipient can re-activate
        from a new device using the same invitation URL.
        """
        invitation = await self._inv_repo.get_by_recipient(recipient_id)
        if not invitation:
            raise NotFoundError("No invitation found for this recipient.")

        if invitation.trusted_device:
            await self._dev_repo.delete(invitation.trusted_device)

        invitation.is_activated = False
        invitation.activated_at = None
        await self._inv_repo.update(invitation)
