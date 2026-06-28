from __future__ import annotations

from typing import Sequence

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.recipient import Recipient
from app.infrastructure.repositories.base import BaseRepository


class RecipientRepository(BaseRepository[Recipient]):
    model = Recipient

    async def get_by_slug(self, slug: str) -> Recipient | None:
        stmt = select(Recipient).where(Recipient.slug == slug, Recipient.is_active == True)  # noqa: E712
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Recipient | None:
        stmt = select(Recipient).where(
            Recipient.email == email.lower(), Recipient.is_active == True  # noqa: E712
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str) -> bool:
        stmt = select(Recipient.id).where(Recipient.slug == slug)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def search(
        self,
        query: str | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> Sequence[Recipient]:
        stmt = select(Recipient)
        if active_only:
            stmt = stmt.where(Recipient.is_active == True)  # noqa: E712
        if query:
            like = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Recipient.display_name.ilike(like),
                    Recipient.email.ilike(like),
                    Recipient.department.ilike(like),
                )
            )
        stmt = stmt.order_by(Recipient.created_at.desc()).offset(skip).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def count(self, active_only: bool = True) -> int:
        from sqlalchemy import func, select as sa_select
        stmt = sa_select(func.count(Recipient.id))
        if active_only:
            stmt = stmt.where(Recipient.is_active == True)  # noqa: E712
        result = await self._session.execute(stmt)
        return result.scalar_one()
