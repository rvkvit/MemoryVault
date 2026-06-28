from __future__ import annotations

import hashlib
import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.guestbook import (
    GuestbookEntryCreate,
    GuestbookEntryOut,
    GuestbookListResponse,
)
from app.application.services.guestbook import GuestbookService
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/pages/{slug}/guestbook", tags=["Guestbook"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "",
    response_model=GuestbookListResponse,
    summary="List guestbook entries for a farewell page",
    description="Returns a cursor-paginated list of visible guestbook entries, newest first.",
)
async def list_entries(
    db: DbDep,
    user: CurrentUser,
    slug: str = Path(...),
    cursor: str | None = Query(None, description="Opaque pagination cursor"),
    limit: int = Query(20, ge=1, le=50),
):
    service = GuestbookService(db)
    entries, next_cursor, total = await service.list_entries(
        slug=slug, limit=limit, cursor=cursor
    )
    return GuestbookListResponse(
        entries=[GuestbookEntryOut.model_validate(e) for e in entries],
        next_cursor=next_cursor,
        has_more=next_cursor is not None,
        total=total,
    )


@router.post(
    "",
    response_model=GuestbookEntryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Post a message to the guestbook",
    description=(
        "Creates a new guestbook entry. The author's identity comes from the "
        "authenticated session — it cannot be overridden by the request body. "
        "Maximum 3 posts per author per page."
    ),
    responses={
        429: {"description": "Post limit reached for this page"},
        403: {"description": "Guestbook is disabled for this page"},
    },
)
async def create_entry(
    request: Request,
    db: DbDep,
    user: CurrentUser,
    body: GuestbookEntryCreate,
    slug: str = Path(...),
):
    service = GuestbookService(db)
    entry = await service.create_entry(
        slug=slug,
        message=body.message,
        reaction_emoji=body.reaction_emoji,
        author_email=user["email"],
        author_display_name=user["name"],
        author_avatar_url=None,  # Could be fetched from Microsoft Graph in a future iteration
        ip_hash=_hash_ip(request),
    )
    return GuestbookEntryOut.model_validate(entry)


def _hash_ip(request: Request) -> str:
    ip = ""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.client:
        ip = request.client.host
    return hmac.new(
        settings.STATE_HMAC_SECRET.encode(), ip.encode(), hashlib.sha256
    ).hexdigest()
