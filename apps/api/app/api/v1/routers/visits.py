"""
Visit tracking router — authenticated, no admin restriction.

Both RECIPIENT and ADMIN roles can create and update visit logs. The service
layer enforces that recipients can only log visits for their own page.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DbSession
from app.api.v1.schemas.visit import VisitPingRequest, VisitStartRequest, VisitStartResponse
from app.application.services.visit_tracker import VisitTrackerService

router = APIRouter(prefix="/visits", tags=["Visits"])


@router.post("", response_model=VisitStartResponse, status_code=201)
async def start_visit(
    body: VisitStartRequest,
    db: DbSession,
    user: CurrentUser,
    user_agent: Annotated[str | None, Header()] = None,
) -> VisitStartResponse:
    """Record the start of a page visit. Returns a visit_id for subsequent pings."""
    service = VisitTrackerService(db)
    visit_id = await service.start_visit(
        page_id=body.page_id,
        user=user,
        raw_ua=user_agent,
        referrer=body.referrer,
    )
    return VisitStartResponse(visit_id=visit_id)


@router.patch("/{visit_id}", status_code=204)
async def ping_visit(
    visit_id: str,
    body: VisitPingRequest,
    db: DbSession,
    user: CurrentUser,
) -> Response:
    """Update elapsed time for an ongoing visit (heartbeat + final beacon)."""
    service = VisitTrackerService(db)
    await service.ping_visit(
        visit_id=visit_id,
        elapsed_seconds=body.elapsed_seconds,
        user=user,
    )
    return Response(status_code=204)
