"""
Admin Memory Vault endpoints.
"""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.api.v1.schemas.memory import MemoryListResponse, MemoryOut
from app.application.services.memory import MemoryService
from app.application.services.page import PageService
from app.core.database import get_db
from app.core.exceptions import NotFoundError

router = APIRouter(
    prefix="/admin/memories",
    tags=["Admin — Memory Vault"],
    dependencies=[Depends(require_admin)],
)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/by-recipient/{recipient_id}",
    response_model=MemoryListResponse,
    summary="List memories for a recipient",
)
async def list_memories(
    db: DbDep,
    recipient_id: str = Path(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    favourites_only: bool = Query(False),
):
    service = MemoryService(db)
    entries, total = await service.list_for_recipient(
        recipient_id,
        skip=skip,
        limit=limit,
        search=search,
        favourites_only=favourites_only,
    )
    return MemoryListResponse(
        entries=entries,
        total=total,
        has_more=(skip + len(entries)) < total,
    )


@router.post(
    "/entries/{entry_id}/favourite",
    response_model=MemoryOut,
    summary="Toggle favourite flag on a memory entry",
)
async def toggle_favourite(
    db: DbDep,
    entry_id: str = Path(...),
):
    service = MemoryService(db)
    return await service.toggle_favourite(entry_id)


@router.delete(
    "/entries/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hide (soft-delete) a memory entry",
)
async def hide_memory(
    db: DbDep,
    entry_id: str = Path(...),
):
    service = MemoryService(db)
    await service.hide(entry_id)


@router.get(
    "/by-recipient/{recipient_id}/export",
    summary="Export all memories for a recipient as CSV",
)
async def export_memories_csv(
    db: DbDep,
    recipient_id: str = Path(...),
):
    service = MemoryService(db)
    csv_content = await service.export_csv_by_recipient(recipient_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="memories-{recipient_id}.csv"'
        },
    )
