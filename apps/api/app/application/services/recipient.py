from __future__ import annotations

import json
import re
import secrets
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.log import get_logger
from app.domain.enums import AuditEventType
from app.infrastructure.models.audit import AuditLog
from app.infrastructure.models.recipient import Recipient
from app.infrastructure.repositories.recipient import RecipientRepository

logger = get_logger(__name__)


class RecipientService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = RecipientRepository(session)

    async def get_by_id(self, recipient_id: str) -> Recipient:
        recipient = await self._repo.get_by_id(recipient_id)
        if not recipient:
            raise NotFoundError(f"Recipient {recipient_id!r} not found")
        return recipient

    async def get_by_slug(self, slug: str) -> Recipient:
        recipient = await self._repo.get_by_slug(slug)
        if not recipient:
            raise NotFoundError(f"No active recipient found for slug {slug!r}")
        return recipient

    async def get_by_email(self, email: str) -> Recipient | None:
        return await self._repo.get_by_email(email.lower())

    async def search(
        self,
        query: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Sequence[Recipient]:
        return await self._repo.search(query=query, skip=skip, limit=limit)

    async def count(self) -> int:
        return await self._repo.count()

    async def create(
        self,
        *,
        email: str,
        display_name: str,
        job_title: str | None = None,
        department: str | None = None,
        team: str | None = None,
        manager_email: str | None = None,
        hire_date: str | None = None,
        last_day: str | None = None,
        actor_email: str,
    ) -> Recipient:
        email = email.lower().strip()

        existing = await self._repo.get_by_email(email)
        if existing:
            raise ConflictError(f"A recipient with email {email!r} already exists")

        slug = await self._generate_unique_slug(display_name, last_day)

        recipient = await self._repo.create(
            email=email,
            display_name=display_name,
            slug=slug,
            job_title=job_title,
            department=department,
            team=team,
            manager_email=manager_email,
            hire_date=hire_date,
            last_day=last_day,
            created_by=actor_email,
        )

        await self._audit(
            event_type=AuditEventType.RECIPIENT_CREATED,
            actor_email=actor_email,
            resource_id=recipient.id,
            after=recipient,
        )

        logger.info("Recipient created", extra={"id": recipient.id, "email": email})
        return recipient

    async def update(
        self,
        recipient_id: str,
        actor_email: str,
        **fields,
    ) -> Recipient:
        recipient = await self.get_by_id(recipient_id)
        before_snapshot = _snapshot(recipient)

        if "email" in fields and fields["email"]:
            fields["email"] = fields["email"].lower().strip()

        recipient = await self._repo.update(recipient, **{k: v for k, v in fields.items() if v is not None})

        await self._audit(
            event_type=AuditEventType.RECIPIENT_UPDATED,
            actor_email=actor_email,
            resource_id=recipient.id,
            before=before_snapshot,
            after=recipient,
        )
        return recipient

    async def soft_delete(self, recipient_id: str, actor_email: str) -> None:
        recipient = await self.get_by_id(recipient_id)
        await self._repo.update(recipient, is_active=False)
        await self._audit(
            event_type=AuditEventType.RECIPIENT_DELETED,
            actor_email=actor_email,
            resource_id=recipient_id,
        )
        logger.info("Recipient soft-deleted", extra={"id": recipient_id})

    async def _generate_unique_slug(
        self, display_name: str, last_day: str | None
    ) -> str:
        """
        Generate a URL-safe slug with cryptographic entropy.

        WHY WE ADD RANDOM ENTROPY
        --------------------------
        A slug derived purely from name + year (e.g. "alice-chen-2024") is
        guessable by anyone who knows the employee's name and approximate
        departure date. Internal employees know their colleagues' names. An
        attacker could enumerate all plausible slugs with a dictionary attack
        in minutes.

        Adding 6 hex characters of CSPRNG output (24 bits = 16 million
        combinations) makes brute-force enumeration impractical:
          - At 30 req/min (rate limit), exhausting 16M combinations per person
            would take ~370 days per name.
          - The name-component still makes the slug human-recognizable in URLs
            (useful for admin identification), while the suffix is unguessable.

        Example output: "alice-chen-2024-f3a9c1"

        WHY 6 HEX CHARS (NOT MORE)
        ----------------------------
        24 bits of entropy is sufficient for an invite-only system where the
        total number of active pages is small (< 10,000 at any time).
        Longer suffixes improve security marginally but make the URL harder to
        share or type. Rate limiting provides the primary defense.
        """
        base = _slugify(display_name)
        if last_day:
            year = last_day[:4]
            base = f"{base}-{year}"

        # Generate a unique slug with collision retry.
        # Collisions on a 6-hex suffix are extremely rare (Birthday paradox:
        # ~16M space, < 10K records → ~0.003% collision probability per attempt).
        for _ in range(10):  # 10 attempts before giving up
            suffix = secrets.token_hex(3)    # 3 bytes → 6 hex chars → 24-bit entropy
            slug   = f"{base}-{suffix}"
            if not await self._repo.slug_exists(slug):
                return slug

        # Extremely unlikely fallback (after 10 hex collisions)
        raise RuntimeError(f"Could not generate a unique slug for {display_name!r} after 10 attempts")

    async def _audit(
        self,
        event_type: AuditEventType,
        actor_email: str,
        resource_id: str | None = None,
        before: str | None = None,
        after: Recipient | None = None,
    ) -> None:
        log = AuditLog(
            event_type=event_type,
            actor_email=actor_email,
            resource_type="recipient",
            resource_id=resource_id,
            before_snapshot=before,
            after_snapshot=_snapshot(after) if after else None,
        )
        self._session.add(log)
        await self._session.flush()


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80]


def _snapshot(obj: Recipient | None) -> str | None:
    if obj is None:
        return None
    return json.dumps(
        {
            "id": obj.id,
            "email": obj.email,
            "slug": obj.slug,
            "display_name": obj.display_name,
            "is_active": obj.is_active,
        }
    )
