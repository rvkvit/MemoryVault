from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, require_admin
from app.api.v1.schemas.page import PageOut, PageUpdate
from app.application.services.page import PageService
from app.core.database import get_db
from app.core.exceptions import NotFoundError

router = APIRouter(
    prefix="/admin/pages",
    tags=["Admin — Pages"],
    dependencies=[Depends(require_admin)],
)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/{recipient_id}",
    response_model=PageOut,
    summary="Get the page for a recipient (regardless of published state)",
)
async def get_page(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
):
    service = PageService(db)
    page = await service.get_for_admin(recipient_id)
    if not page:
        raise NotFoundError(f"No page found for recipient {recipient_id!r}")
    return PageOut.model_validate(page)


@router.put(
    "/{recipient_id}",
    response_model=PageOut,
    summary="Upsert page content for a recipient",
    description=(
        "Creates the page if it does not exist, otherwise updates it. "
        "If `timeline_events` is provided, the existing events are replaced atomically."
    ),
)
async def upsert_page(
    db: DbDep,
    user: AdminUser,
    body: PageUpdate,
    recipient_id: str = Path(...),
):
    service = PageService(db)
    page = await service.upsert(
        recipient_id=recipient_id,
        actor_email=user["email"],
        personalized_message=body.personalized_message,
        theme=body.theme,
        show_guestbook=body.show_guestbook,
        show_timeline=body.show_timeline,
        show_photos=body.show_photos,
        show_video=body.show_video,
        timeline_events=(
            [e.model_dump() for e in body.timeline_events]
            if body.timeline_events is not None
            else None
        ),
    )
    return PageOut.model_validate(page)


@router.post(
    "/{recipient_id}/publish",
    response_model=PageOut,
    summary="Publish a farewell page",
    description="Sets is_published=True and records the published_at timestamp.",
    responses={409: {"description": "Page is already published"}},
)
async def publish_page(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
):
    service = PageService(db)
    page = await service.publish(recipient_id=recipient_id, actor_email=user["email"])
    return PageOut.model_validate(page)


@router.post(
    "/{recipient_id}/unpublish",
    response_model=PageOut,
    summary="Unpublish a farewell page",
    description="Sets is_published=False. Any active sessions for this recipient will be unable to reload the page.",
)
async def unpublish_page(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
):
    service = PageService(db)
    page = await service.unpublish(recipient_id=recipient_id, actor_email=user["email"])
    return PageOut.model_validate(page)
