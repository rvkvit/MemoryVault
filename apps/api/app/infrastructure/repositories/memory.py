from __future__ import annotations

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.memory import MemoryEntry


class MemoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, entry: MemoryEntry) -> MemoryEntry:
        self._db.add(entry)
        await self._db.flush()
        # No refresh needed — all attributes are set from Python-side defaults
        # and explicit values; refresh() would trigger async lazy-load issues.
        return entry

    async def get(self, entry_id: str) -> MemoryEntry | None:
        result = await self._db.execute(
            select(MemoryEntry).where(MemoryEntry.id == entry_id)
        )
        return result.scalar_one_or_none()

    async def list_for_recipient(
        self,
        recipient_id: str,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        favourites_only: bool = False,
    ) -> tuple[list[MemoryEntry], int]:
        q = select(MemoryEntry).where(
            MemoryEntry.recipient_id == recipient_id,
            MemoryEntry.is_hidden == False,  # noqa: E712
        )
        if search:
            term = f"%{search}%"
            q = q.where(
                (MemoryEntry.submitter_name.ilike(term)) |
                (MemoryEntry.message.ilike(term))
            )
        if favourites_only:
            q = q.where(MemoryEntry.is_favourite == True)  # noqa: E712

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self._db.execute(count_q)).scalar_one()

        q = q.order_by(MemoryEntry.created_at.desc()).offset(skip).limit(limit)
        rows = (await self._db.execute(q)).scalars().all()
        return list(rows), total

    async def list_all_by_recipient(self, recipient_id: str) -> list[MemoryEntry]:
        """Return all visible entries for CSV export."""
        result = await self._db.execute(
            select(MemoryEntry)
            .where(MemoryEntry.recipient_id == recipient_id, MemoryEntry.is_hidden == False)  # noqa: E712
            .order_by(MemoryEntry.created_at.asc())
        )
        return list(result.scalars().all())

    async def toggle_favourite(self, entry_id: str) -> MemoryEntry | None:
        entry = await self.get(entry_id)
        if entry:
            entry.is_favourite = not entry.is_favourite
            await self._db.flush()
        return entry

    async def hide(self, entry_id: str) -> None:
        entry = await self.get(entry_id)
        if entry:
            entry.is_hidden = True
            await self._db.flush()
