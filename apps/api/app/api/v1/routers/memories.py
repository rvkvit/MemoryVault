"""
Public memory submission endpoint — no authentication required.

Colleagues visit the farewell page and submit memories. The endpoint validates
the slug (page must exist and be published), then stores the text, optional
voice note, and optional image.
"""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, Path, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.memory import MemoryOut
from app.application.services.memory import MemoryService
from app.application.services.page import PageService
from app.core.database import get_db
from app.core.log import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/pages", tags=["Memories"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/{slug}/memories",
    response_model=MemoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a memory on a farewell page",
    description=(
        "No authentication required. The page must be published. "
        "Submitter provides name (required), optional email, message (max 5,000 chars), "
        "an optional voice recording (max 20 MB), and an optional image (max 10 MB)."
    ),
)
async def submit_memory(
    request: Request,
    db: DbDep,
    slug: str = Path(...),
    submitter_name: str = Form(..., min_length=1, max_length=255),
    submitter_email: Optional[str] = Form(None),
    message: str = Form(..., min_length=1, max_length=5000),
    voice: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
):
    page_service = PageService(db)
    # Raises NotFoundError / PageNotPublishedError if invalid — caught by middleware
    page = await page_service.get_by_slug(slug)

    client_ip = _client_ip(request)

    service = MemoryService(db)
    entry = await service.create(
        page_id=page.id,
        recipient_id=page.recipient_id,
        submitter_name=submitter_name,
        submitter_email=submitter_email,
        message=message,
        voice_file=voice if (voice and voice.filename) else None,
        image_file=image if (image and image.filename) else None,
        client_ip=client_ip,
    )
    return entry


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""
