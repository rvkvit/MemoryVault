from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.domain.enums import UserRole
from app.infrastructure.models.page import Page
from app.infrastructure.repositories.visit_log import VisitLogRepository


# ── User-agent parsing ────────────────────────────────────────────────────────

_BROWSER_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("Edge",    re.compile(r"Edg(?:e|)/", re.I)),
    ("Opera",   re.compile(r"OPR/|Opera", re.I)),
    ("Chrome",  re.compile(r"Chrome/",    re.I)),
    ("Firefox", re.compile(r"Firefox/",   re.I)),
    ("Safari",  re.compile(r"Safari/",    re.I)),
]

_MOBILE_PATTERN = re.compile(r"Mobile|iP(?:hone|od)|Android.*Mobile", re.I)
_TABLET_PATTERN = re.compile(r"Tablet|iPad|Android(?!.*Mobile)", re.I)


def _parse_browser(ua: str) -> str:
    for name, pattern in _BROWSER_PATTERNS:
        if pattern.search(ua):
            return name
    return "Other"


def _parse_device(ua: str) -> str:
    if _TABLET_PATTERN.search(ua):
        return "Tablet"
    if _MOBILE_PATTERN.search(ua):
        return "Mobile"
    return "Desktop"


# ── Service ───────────────────────────────────────────────────────────────────

class VisitTrackerService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = VisitLogRepository(session)

    async def start_visit(
        self,
        *,
        page_id: str,
        user: dict,
        raw_ua: str | None,
        referrer: str | None,
    ) -> str:
        """
        Create a VisitLog record and return its ID.

        Authorization:
          RECIPIENT — may only log visits for the page that belongs to them.
          ADMIN     — may log visits for any page (for testing / preview purposes).
        """
        page = await self._get_page(page_id)

        if user.get("role") == UserRole.RECIPIENT:
            jwt_recipient_id = user.get("recipient_id")
            if jwt_recipient_id != page.recipient_id:
                raise ForbiddenError("You can only track visits to your own farewell page.")

        browser     = _parse_browser(raw_ua or "")
        device_type = _parse_device(raw_ua or "")

        log = await self._repo.create(
            page_id=page_id,
            recipient_id=page.recipient_id,
            browser=browser,
            device_type=device_type,
            raw_user_agent=raw_ua,
            referrer=referrer,
        )
        await self._session.commit()
        return log.id

    async def ping_visit(
        self,
        *,
        visit_id: str,
        elapsed_seconds: int,
        user: dict,
    ) -> None:
        """Update the duration for an existing visit. Verifies ownership."""
        log = await self._repo.get(visit_id)
        if log is None:
            raise NotFoundError("Visit not found")

        if user.get("role") == UserRole.RECIPIENT:
            jwt_recipient_id = user.get("recipient_id")
            if jwt_recipient_id != log.recipient_id:
                raise ForbiddenError("Cannot update a visit that does not belong to you.")

        await self._repo.update_duration(visit_id, elapsed_seconds)
        await self._session.commit()

    async def _get_page(self, page_id: str) -> Page:
        from sqlalchemy import select as sa_select
        stmt = sa_select(Page).where(Page.id == page_id)
        result = await self._session.execute(stmt)
        page = result.scalar_one_or_none()
        if page is None:
            raise NotFoundError("Page not found")
        return page
