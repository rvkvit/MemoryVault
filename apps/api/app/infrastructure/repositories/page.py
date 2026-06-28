from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.page import Page, TimelineEvent, MediaAsset
from app.infrastructure.models.recipient import Recipient
from app.infrastructure.repositories.base import BaseRepository


class PageRepository(BaseRepository[Page]):
    model = Page

    async def get_by_recipient_id(self, recipient_id: str) -> Page | None:
        stmt = (
            select(Page)
            .where(Page.recipient_id == recipient_id)
            .options(
                selectinload(Page.timeline_events),
                selectinload(Page.media_assets),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Page | None:
        """Join through Recipient to resolve a slug in a single query."""
        stmt = (
            select(Page)
            .join(Recipient, Page.recipient_id == Recipient.id)
            .where(Recipient.slug == slug, Recipient.is_active == True)  # noqa: E712
            .options(
                selectinload(Page.recipient),
                selectinload(Page.timeline_events),
                selectinload(Page.media_assets),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def increment_view_count(self, page_id: str) -> None:
        stmt = (
            update(Page)
            .where(Page.id == page_id)
            .values(view_count=Page.view_count + 1)
        )
        await self._session.execute(stmt)


class TimelineEventRepository(BaseRepository[TimelineEvent]):
    model = TimelineEvent

    async def delete_all_for_page(self, page_id: str) -> None:
        from sqlalchemy import delete
        stmt = delete(TimelineEvent).where(TimelineEvent.page_id == page_id)
        await self._session.execute(stmt)


class MediaAssetRepository(BaseRepository[MediaAsset]):
    model = MediaAsset

    async def get_by_page(self, page_id: str) -> list[MediaAsset]:
        stmt = (
            select(MediaAsset)
            .where(MediaAsset.page_id == page_id, MediaAsset.is_approved == True)  # noqa: E712
            .order_by(MediaAsset.display_order)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
