from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.visit_log import VisitLog


class VisitLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        page_id: str,
        recipient_id: str,
        browser: str,
        device_type: str,
        raw_user_agent: str | None,
        referrer: str | None,
    ) -> VisitLog:
        log = VisitLog(
            page_id=page_id,
            recipient_id=recipient_id,
            browser=browser,
            device_type=device_type,
            raw_user_agent=raw_user_agent,
            referrer=referrer,
        )
        self._session.add(log)
        await self._session.flush()
        return log

    async def update_duration(self, visit_id: str, elapsed_seconds: int) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            update(VisitLog)
            .where(VisitLog.id == visit_id)
            .values(duration_seconds=elapsed_seconds, last_ping_at=now)
        )
        await self._session.execute(stmt)

    async def get(self, visit_id: str) -> VisitLog | None:
        stmt = select(VisitLog).where(VisitLog.id == visit_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
