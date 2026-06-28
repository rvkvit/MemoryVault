from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.invitation import InvitationToken, TrustedDevice


class InvitationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_recipient(self, recipient_id: str) -> InvitationToken | None:
        result = await self._db.execute(
            select(InvitationToken).where(InvitationToken.recipient_id == recipient_id)
        )
        return result.scalar_one_or_none()

    async def get_by_token_hash(self, token_hash: str) -> InvitationToken | None:
        result = await self._db.execute(
            select(InvitationToken).where(InvitationToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def create(self, invitation: InvitationToken) -> InvitationToken:
        self._db.add(invitation)
        await self._db.flush()
        await self._db.refresh(invitation)
        return invitation

    async def update(self, invitation: InvitationToken) -> InvitationToken:
        await self._db.flush()
        await self._db.refresh(invitation)
        return invitation

    async def delete(self, invitation: InvitationToken) -> None:
        await self._db.delete(invitation)
        await self._db.flush()


class TrustedDeviceRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_device_hash(self, device_token_hash: str) -> TrustedDevice | None:
        result = await self._db.execute(
            select(TrustedDevice).where(TrustedDevice.device_token_hash == device_token_hash)
        )
        return result.scalar_one_or_none()

    async def get_by_invitation(self, invitation_id: str) -> TrustedDevice | None:
        result = await self._db.execute(
            select(TrustedDevice).where(TrustedDevice.invitation_id == invitation_id)
        )
        return result.scalar_one_or_none()

    async def create(self, device: TrustedDevice) -> TrustedDevice:
        self._db.add(device)
        await self._db.flush()
        await self._db.refresh(device)
        return device

    async def record_visit(self, device: TrustedDevice) -> None:
        device.last_visit_at = datetime.now(timezone.utc)
        device.visit_count += 1
        await self._db.flush()

    async def delete(self, device: TrustedDevice) -> None:
        await self._db.delete(device)
        await self._db.flush()
