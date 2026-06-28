from __future__ import annotations

import base64
import json
from datetime import datetime, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.audit import OAuthState
from app.infrastructure.models.guestbook import GuestbookEntry
from app.infrastructure.repositories.base import BaseRepository


class GuestbookRepository(BaseRepository[GuestbookEntry]):
    model = GuestbookEntry

    async def list_for_page(
        self,
        page_id: str,
        limit: int = 20,
        cursor: str | None = None,
    ) -> tuple[list[GuestbookEntry], str | None]:
        """
        Returns (entries, next_cursor).
        Entries are ordered newest-first.
        cursor encodes {created_at, id} of the last seen entry.
        """
        stmt = select(GuestbookEntry).where(
            GuestbookEntry.page_id == page_id,
            GuestbookEntry.is_hidden == False,  # noqa: E712
        )

        if cursor:
            decoded = _decode_cursor(cursor)
            stmt = stmt.where(
                or_(
                    GuestbookEntry.created_at < decoded["created_at"],
                    and_(
                        GuestbookEntry.created_at == decoded["created_at"],
                        GuestbookEntry.id < decoded["id"],
                    ),
                )
            )

        stmt = stmt.order_by(
            GuestbookEntry.created_at.desc(),
            GuestbookEntry.id.desc(),
        ).limit(limit + 1)

        result = await self._session.execute(stmt)
        rows = list(result.scalars().all())

        next_cursor: str | None = None
        if len(rows) > limit:
            rows = rows[:limit]
            last = rows[-1]
            next_cursor = _encode_cursor(last.created_at, last.id)

        return rows, next_cursor

    async def count_for_page(self, page_id: str) -> int:
        stmt = select(func.count(GuestbookEntry.id)).where(
            GuestbookEntry.page_id == page_id,
            GuestbookEntry.is_hidden == False,  # noqa: E712
        )
        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def author_post_count(self, page_id: str, author_email: str) -> int:
        stmt = select(func.count(GuestbookEntry.id)).where(
            GuestbookEntry.page_id == page_id,
            GuestbookEntry.author_email == author_email,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one()


class OAuthStateRepository(BaseRepository[OAuthState]):
    model = OAuthState

    async def get_by_state_token(self, state_token: str) -> OAuthState | None:
        stmt = select(OAuthState).where(
            OAuthState.state_token == state_token,
            OAuthState.used == False,  # noqa: E712
            OAuthState.expires_at > datetime.now(timezone.utc),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_used(self, state: OAuthState) -> None:
        state.used = True
        await self._session.flush()

    async def purge_expired(self) -> int:
        from sqlalchemy import delete
        stmt = delete(OAuthState).where(OAuthState.expires_at < datetime.now(timezone.utc))
        result = await self._session.execute(stmt)
        return result.rowcount


def _encode_cursor(created_at: datetime, entry_id: str) -> str:
    payload = json.dumps({"created_at": created_at.isoformat(), "id": entry_id})
    return base64.urlsafe_b64encode(payload.encode()).decode()


def _decode_cursor(cursor: str) -> dict:
    payload = json.loads(base64.urlsafe_b64decode(cursor + "=="))
    payload["created_at"] = datetime.fromisoformat(payload["created_at"])
    return payload
