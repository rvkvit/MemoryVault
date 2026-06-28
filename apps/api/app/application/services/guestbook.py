from __future__ import annotations

import html
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError, RateLimitError
from app.core.log import get_logger
from app.infrastructure.models.guestbook import GuestbookEntry
from app.infrastructure.repositories.guestbook import GuestbookRepository
from app.infrastructure.repositories.page import PageRepository

logger = get_logger(__name__)

_MAX_POSTS_PER_AUTHOR = 3
_MAX_MESSAGE_LENGTH = 2000
_MIN_MESSAGE_LENGTH = 10


class GuestbookService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = GuestbookRepository(session)
        self._page_repo = PageRepository(session)

    async def list_entries(
        self,
        slug: str,
        limit: int = 20,
        cursor: str | None = None,
    ) -> tuple[list[GuestbookEntry], str | None, int]:
        """Returns (entries, next_cursor, total_count)."""
        page = await self._page_repo.get_by_slug(slug)
        if not page:
            raise NotFoundError(f"Page not found for slug {slug!r}")

        entries, next_cursor = await self._repo.list_for_page(
            page.id, limit=limit, cursor=cursor
        )
        total = await self._repo.count_for_page(page.id)
        return entries, next_cursor, total

    async def create_entry(
        self,
        slug: str,
        *,
        message: str,
        reaction_emoji: str | None,
        author_email: str,
        author_display_name: str,
        author_avatar_url: str | None,
        ip_hash: str | None = None,
    ) -> GuestbookEntry:
        page = await self._page_repo.get_by_slug(slug)
        if not page:
            raise NotFoundError(f"Page not found for slug {slug!r}")

        if not page.show_guestbook:
            raise ForbiddenError("Guestbook is disabled for this page")

        # Rate limit: max posts per author per page
        existing_count = await self._repo.author_post_count(page.id, author_email)
        if existing_count >= _MAX_POSTS_PER_AUTHOR:
            raise RateLimitError(
                f"You have already posted {existing_count} messages on this page "
                f"(maximum is {_MAX_POSTS_PER_AUTHOR})"
            )

        clean_message = _sanitize_message(message)

        if len(clean_message) < _MIN_MESSAGE_LENGTH:
            raise ValueError(f"Message must be at least {_MIN_MESSAGE_LENGTH} characters")
        if len(clean_message) > _MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message must not exceed {_MAX_MESSAGE_LENGTH} characters")

        if reaction_emoji and not _is_single_emoji(reaction_emoji):
            reaction_emoji = None

        entry = await self._repo.create(
            page_id=page.id,
            author_email=author_email,
            author_display_name=author_display_name,
            author_avatar_url=author_avatar_url,
            message=clean_message,
            reaction_emoji=reaction_emoji,
            ip_hash=ip_hash,
        )

        logger.info(
            "Guestbook entry created",
            extra={"page_id": page.id, "author": author_email},
        )
        return entry

    async def hide_entry(
        self, entry_id: str, actor_email: str
    ) -> GuestbookEntry:
        entry = await self._repo.get_by_id(entry_id)
        if not entry:
            raise NotFoundError(f"Guestbook entry {entry_id!r} not found")
        return await self._repo.update(entry, is_hidden=True)


def _sanitize_message(text: str) -> str:
    """Strip all HTML tags and unescape HTML entities, then normalize whitespace."""
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Unescape &amp; &lt; etc.
    text = html.unescape(text)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _is_single_emoji(value: str) -> bool:
    """Rough check that the value is a single emoji character (not multi-char text)."""
    if len(value) > 4:
        return False
    # Allow printable non-ASCII (emoji range), reject plain ASCII text
    return any(ord(c) > 127 for c in value)
