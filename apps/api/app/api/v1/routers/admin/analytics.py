from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, require_admin
from app.api.v1.schemas.analytics import AnalyticsResponse
from app.application.services.analytics import AnalyticsService
from app.core.database import get_db

router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin — Analytics"],
    dependencies=[Depends(require_admin)],
)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "",
    response_model=AnalyticsResponse,
    summary="Get dashboard stats and per-recipient visit analytics",
    description=(
        "Returns aggregate counts (stats) and a per-recipient breakdown "
        "with view counts and publish status. Results are ordered by view count descending."
    ),
)
async def get_analytics(db: DbDep, user: AdminUser):
    service = AnalyticsService(db)
    return await service.get_analytics()


@router.get(
    "/export",
    summary="Export visitor analytics as a CSV download",
    responses={
        200: {
            "content": {"text/csv": {}},
            "description": "CSV file with one row per recipient",
        }
    },
)
async def export_analytics(db: DbDep, user: AdminUser):
    service = AnalyticsService(db)
    csv_content = await service.export_csv()
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="farewell-analytics.csv"',
        },
    )
