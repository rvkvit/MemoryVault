from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, Path, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, require_admin
from app.api.v1.schemas.page import MediaAssetAdminOut
from app.application.services.media import MediaService
from app.core.database import get_db

router = APIRouter(
    prefix="/admin",
    tags=["Admin — Media"],
    dependencies=[Depends(require_admin)],
)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/recipients/{recipient_id}/avatar",
    summary="Upload an avatar image for a recipient",
    responses={
        200: {"description": "Avatar uploaded; returns the public URL"},
        400: {"description": "Unsupported file type or file too large"},
        404: {"description": "Recipient not found"},
    },
)
async def upload_avatar(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
    file: UploadFile = File(..., description="JPEG/PNG/WebP/GIF image, max 50 MB"),
):
    service = MediaService(db)
    url = await service.upload_avatar(recipient_id, file, actor_email=user["email"])
    return {"url": url}


@router.post(
    "/pages/{recipient_id}/media",
    response_model=MediaAssetAdminOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a photo or video to a recipient's farewell page",
    description=(
        "The page must exist before uploading media. "
        "Use `PUT /admin/pages/{recipient_id}` (with an empty body) to create it first."
    ),
    responses={
        201: {"description": "Asset created and linked to the page"},
        400: {"description": "Unsupported file type or file too large"},
        404: {"description": "Recipient or page not found"},
    },
)
async def upload_media(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
    file: UploadFile = File(..., description="Image or video file, max 50 MB"),
    caption: Optional[str] = Form(None, max_length=500),
):
    service = MediaService(db)
    asset = await service.upload_media(
        recipient_id, file, actor_email=user["email"], caption=caption
    )
    return MediaAssetAdminOut.model_validate(asset)


@router.delete(
    "/pages/{recipient_id}/media/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a media asset from a page",
    description="Removes the record from the database and deletes the file from local storage.",
    responses={
        404: {"description": "Asset or recipient not found"},
    },
)
async def delete_media(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
    asset_id: str = Path(...),
):
    service = MediaService(db)
    await service.delete_asset(asset_id, recipient_id)
