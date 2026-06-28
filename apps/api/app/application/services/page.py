from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, PageNotPublishedError
from app.core.log import get_logger
from app.domain.enums import AuditEventType
from app.infrastructure.models.audit import AuditLog
from app.infrastructure.models.page import Page, TimelineEvent
from app.infrastructure.repositories.page import PageRepository, TimelineEventRepository
from app.infrastructure.repositories.recipient import RecipientRepository

logger = get_logger(__name__)


class PageService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = PageRepository(session)
        self._timeline_repo = TimelineEventRepository(session)
        self._recipient_repo = RecipientRepository(session)

    async def get_by_slug(self, slug: str) -> Page:
        """
        Retrieve a published page. Raises NotFoundError if missing,
        PageNotPublishedError if the page exists but is not yet published.
        """
        page = await self._repo.get_by_slug(slug)
        if not page:
            raise NotFoundError(f"No page found for slug {slug!r}")
        if not page.is_published:
            raise PageNotPublishedError()
        return page

    async def get_for_admin(self, recipient_id: str) -> Page | None:
        """Returns page regardless of published state — for admin editing."""
        return await self._repo.get_by_recipient_id(recipient_id)

    async def upsert(
        self,
        recipient_id: str,
        actor_email: str,
        *,
        personalized_message: str | None = None,
        theme: str | None = None,
        show_guestbook: bool | None = None,
        show_timeline: bool | None = None,
        show_photos: bool | None = None,
        show_video: bool | None = None,
        timeline_events: list[dict[str, Any]] | None = None,
    ) -> Page:
        # Validate recipient exists
        recipient = await self._recipient_repo.get_by_id(recipient_id)
        if not recipient:
            raise NotFoundError(f"Recipient {recipient_id!r} not found")

        page = await self._repo.get_by_recipient_id(recipient_id)

        if page is None:
            page = Page(recipient_id=recipient_id)
            self._session.add(page)
            await self._session.flush()
            event_type = AuditEventType.PAGE_CREATED
        else:
            event_type = AuditEventType.PAGE_UPDATED

        if personalized_message is not None:
            page.personalized_message = personalized_message
        if theme is not None:
            page.theme = theme
        if show_guestbook is not None:
            page.show_guestbook = show_guestbook
        if show_timeline is not None:
            page.show_timeline = show_timeline
        if show_photos is not None:
            page.show_photos = show_photos
        if show_video is not None:
            page.show_video = show_video

        await self._session.flush()

        # Replace timeline events atomically
        if timeline_events is not None:
            await self._timeline_repo.delete_all_for_page(page.id)
            for order, event_data in enumerate(timeline_events):
                event = TimelineEvent(
                    page_id=page.id,
                    event_date=event_data["event_date"],
                    title=event_data["title"],
                    description=event_data.get("description"),
                    icon=event_data.get("icon"),
                    display_order=order,
                )
                self._session.add(event)
            await self._session.flush()

        page_id = page.id
        await self._audit(event_type, actor_email, page_id)
        logger.info("Page upserted", extra={"page_id": page_id, "recipient_id": recipient_id})

        # Re-fetch with selectinload so timeline_events and media_assets are
        # eagerly loaded — avoids MissingGreenlet on async lazy access during
        # Pydantic serialization in the route handler.
        result = await self._repo.get_by_recipient_id(recipient_id)
        assert result is not None
        return result

    async def publish(self, recipient_id: str, actor_email: str) -> Page:
        page = await self._repo.get_by_recipient_id(recipient_id)
        if not page:
            raise NotFoundError(f"No page found for recipient {recipient_id!r}")
        if page.is_published:
            raise ConflictError("Page is already published")

        page.is_published = True
        page.published_at = datetime.now(timezone.utc)
        await self._session.flush()
        await self._audit(AuditEventType.PAGE_PUBLISHED, actor_email, page.id)
        logger.info("Page published", extra={"page_id": page.id})
        return page

    async def unpublish(self, recipient_id: str, actor_email: str) -> Page:
        page = await self._repo.get_by_recipient_id(recipient_id)
        if not page:
            raise NotFoundError(f"No page found for recipient {recipient_id!r}")

        page.is_published = False
        await self._session.flush()
        await self._audit(AuditEventType.PAGE_UNPUBLISHED, actor_email, page.id)
        logger.info("Page unpublished", extra={"page_id": page.id})
        return page

    async def increment_view(self, page_id: str) -> None:
        await self._repo.increment_view_count(page_id)

    async def _audit(
        self, event_type: AuditEventType, actor_email: str, page_id: str
    ) -> None:
        log = AuditLog(
            event_type=event_type,
            actor_email=actor_email,
            resource_type="page",
            resource_id=page_id,
        )
        self._session.add(log)
        await self._session.flush()
