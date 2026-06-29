from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.analytics import (
    AnalyticsResponse,
    BrowserStat,
    ChartData,
    DailyVisit,
    DashboardStats,
    DeviceStat,
    RecipientAnalyticsRow,
)
from app.infrastructure.models.guestbook import GuestbookEntry
from app.infrastructure.models.invitation import InvitationToken
from app.infrastructure.models.page import Page
from app.infrastructure.models.recipient import Recipient
from app.infrastructure.models.visit_log import VisitLog


class AnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_analytics(self) -> AnalyticsResponse:
        # ── 1. Recipients + page + invitation stats (LEFT JOIN) ───────────────
        # Subquery: count guestbook entries per recipient (via their page)
        guestbook_sq = (
            select(func.count(GuestbookEntry.id))
            .join(Page, GuestbookEntry.page_id == Page.id)
            .where(Page.recipient_id == Recipient.id)
            .correlate(Recipient)
            .scalar_subquery()
        )

        page_stmt = (
            select(
                Recipient.id,
                Recipient.slug,
                Recipient.display_name,
                Recipient.email,
                Recipient.department,
                Recipient.last_day,
                Recipient.is_active,
                func.coalesce(Page.view_count, 0).label("view_count"),
                func.coalesce(Page.is_published, False).label("is_published"),
                Page.published_at,
                func.coalesce(InvitationToken.generation_count, 0).label("invitation_generation_count"),
                InvitationToken.created_at.label("invitation_generated_at"),
                func.coalesce(InvitationToken.is_activated, False).label("invitation_is_activated"),
                (guestbook_sq > 0).label("has_guestbook_entry"),
            )
            .outerjoin(Page, Page.recipient_id == Recipient.id)
            .outerjoin(InvitationToken, InvitationToken.recipient_id == Recipient.id)
            .where(Recipient.is_active == True)  # noqa: E712
            .order_by(func.coalesce(Page.view_count, 0).desc(), Recipient.created_at.desc())
        )
        page_result = await self._session.execute(page_stmt)
        page_rows = page_result.all()

        # ── 2. Per-recipient visit aggregates ─────────────────────────────────
        visit_agg_stmt = select(
            VisitLog.recipient_id,
            func.count().label("total_visits"),
            func.min(VisitLog.started_at).label("first_visit"),
            func.max(VisitLog.started_at).label("last_visit"),
            func.avg(VisitLog.duration_seconds).label("avg_duration"),
        ).group_by(VisitLog.recipient_id)
        visit_result = await self._session.execute(visit_agg_stmt)
        visit_map: dict[str, dict] = {
            row.recipient_id: {
                "total_visits": int(row.total_visits),
                "first_visit": row.first_visit,
                "last_visit": row.last_visit,
                "avg_duration": float(row.avg_duration) if row.avg_duration is not None else None,
            }
            for row in visit_result.all()
        }

        # ── 3. Browser breakdown (global) ──────────────────────────────────────
        browser_stmt = (
            select(VisitLog.browser, func.count().label("count"))
            .group_by(VisitLog.browser)
            .order_by(func.count().desc())
        )
        browser_rows = (await self._session.execute(browser_stmt)).all()
        browsers = [BrowserStat(browser=r.browser, count=int(r.count)) for r in browser_rows]

        # ── 4. Device breakdown (global) ───────────────────────────────────────
        device_stmt = (
            select(VisitLog.device_type, func.count().label("count"))
            .group_by(VisitLog.device_type)
            .order_by(func.count().desc())
        )
        device_rows = (await self._session.execute(device_stmt)).all()
        devices = [DeviceStat(device=r.device_type, count=int(r.count)) for r in device_rows]

        # ── 5. Daily visits — last 30 days ─────────────────────────────────────
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        daily_stmt = (
            select(
                func.date(VisitLog.started_at).label("date"),
                func.count().label("visits"),
            )
            .where(VisitLog.started_at >= thirty_days_ago)
            .group_by(func.date(VisitLog.started_at))
            .order_by(func.date(VisitLog.started_at))
        )
        daily_rows = (await self._session.execute(daily_stmt)).all()
        daily_visits = [DailyVisit(date=str(r.date), visits=int(r.visits)) for r in daily_rows]

        # ── 6. Assemble rows ───────────────────────────────────────────────────
        recipients = []
        for row in page_rows:
            vdata = visit_map.get(row.id, {})
            fv: datetime | None = vdata.get("first_visit")
            lv: datetime | None = vdata.get("last_visit")
            recipients.append(
                RecipientAnalyticsRow(
                    id=row.id,
                    slug=row.slug,
                    display_name=row.display_name,
                    email=row.email,
                    department=row.department,
                    last_day=str(row.last_day) if row.last_day else None,
                    is_active=row.is_active,
                    view_count=int(row.view_count),
                    is_published=bool(row.is_published),
                    published_at=row.published_at.isoformat() if row.published_at else None,
                    total_visits=vdata.get("total_visits", 0),
                    first_visit=fv.isoformat() if fv else None,
                    last_visit=lv.isoformat() if lv else None,
                    avg_duration_seconds=vdata.get("avg_duration"),
                    invitation_generation_count=int(row.invitation_generation_count),
                    invitation_generated_at=row.invitation_generated_at.isoformat() if row.invitation_generated_at else None,
                    invitation_is_activated=bool(row.invitation_is_activated),
                    has_guestbook_entry=bool(row.has_guestbook_entry),
                )
            )

        total_visits = sum(r.total_visits for r in recipients)
        stats = DashboardStats(
            total_recipients=len(recipients),
            published_pages=sum(1 for r in recipients if r.is_published),
            unpublished_pages=sum(1 for r in recipients if not r.is_published),
            total_views=sum(r.view_count for r in recipients),
            total_visits=total_visits,
        )

        return AnalyticsResponse(
            stats=stats,
            recipients=recipients,
            charts=ChartData(
                browsers=browsers,
                devices=devices,
                daily_visits=daily_visits,
            ),
        )

    async def export_csv(self) -> str:
        analytics = await self.get_analytics()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Name", "Email", "Department", "Last Day",
            "Page Status", "View Count",
            "Total Visits", "First Visit", "Last Visit", "Avg Duration (s)",
            "Published At",
        ])
        for r in analytics.recipients:
            avg = f"{r.avg_duration_seconds:.0f}" if r.avg_duration_seconds is not None else ""
            writer.writerow([
                r.display_name,
                r.email,
                r.department or "",
                r.last_day or "",
                "Published" if r.is_published else "Draft",
                r.view_count,
                r.total_visits,
                r.first_visit or "",
                r.last_visit or "",
                avg,
                r.published_at or "",
            ])
        return output.getvalue()
