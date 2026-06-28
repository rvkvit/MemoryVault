from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.log import get_logger
from app.infrastructure.models.page import MediaAsset
from app.infrastructure.repositories.page import MediaAssetRepository, PageRepository
from app.infrastructure.repositories.recipient import RecipientRepository

logger = get_logger(__name__)

_ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_ALLOWED_VIDEO = {"video/mp4", "video/webm", "video/quicktime"}
_ALLOWED_ALL = _ALLOWED_IMAGE | _ALLOWED_VIDEO

_EXT_MAP: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}


class MediaService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._page_repo = PageRepository(session)
        self._media_repo = MediaAssetRepository(session)
        self._recipient_repo = RecipientRepository(session)

    async def upload_avatar(
        self,
        recipient_id: str,
        file: UploadFile,
        actor_email: str,
    ) -> str:
        """Upload an avatar image for a recipient. Returns the publicly-accessible URL."""
        recipient = await self._recipient_repo.get_by_id(recipient_id)
        if not recipient:
            raise NotFoundError(f"Recipient {recipient_id!r} not found")

        mime = file.content_type or ""
        if mime not in _ALLOWED_IMAGE:
            raise ValidationError(f"Avatar must be an image (jpeg/png/webp/gif). Received: {mime!r}")

        content = await file.read()
        self._check_size(content)

        ext = _EXT_MAP.get(mime, ".jpg")
        filename = f"avatar_{recipient_id}_{uuid.uuid4().hex[:8]}{ext}"
        dest_dir = Path(settings.UPLOAD_DIR) / "avatars"
        dest_dir.mkdir(parents=True, exist_ok=True)
        (dest_dir / filename).write_bytes(content)

        url = f"{settings.UPLOADS_BASE_URL}/avatars/{filename}"
        recipient.avatar_blob_url = url
        self._session.add(recipient)
        await self._session.flush()

        logger.info("Avatar uploaded", extra={"recipient_id": recipient_id})
        return url

    async def upload_media(
        self,
        recipient_id: str,
        file: UploadFile,
        actor_email: str,
        caption: str | None = None,
    ) -> MediaAsset:
        """Upload a photo or video asset linked to the recipient's page."""
        page = await self._page_repo.get_by_recipient_id(recipient_id)
        if not page:
            raise NotFoundError(
                f"No page found for recipient {recipient_id!r}. "
                "Save the page content first to create it."
            )

        mime = file.content_type or ""
        if mime not in _ALLOWED_ALL:
            raise ValidationError(
                f"Unsupported file type: {mime!r}. "
                "Allowed: jpeg, png, webp, gif, mp4, webm, mov."
            )

        asset_type = "photo" if mime in _ALLOWED_IMAGE else "video"

        content = await file.read()
        self._check_size(content)

        subfolder = f"{asset_type}s"
        ext = _EXT_MAP.get(mime, "")
        filename = f"{asset_type}_{page.id}_{uuid.uuid4().hex[:8]}{ext}"
        dest_dir = Path(settings.UPLOAD_DIR) / subfolder
        dest_dir.mkdir(parents=True, exist_ok=True)
        (dest_dir / filename).write_bytes(content)

        url = f"{settings.UPLOADS_BASE_URL}/{subfolder}/{filename}"

        existing = await self._media_repo.get_by_page(page.id)
        asset = MediaAsset(
            page_id=page.id,
            asset_type=asset_type,
            blob_url=url,
            cdn_url=url,
            file_name=file.filename,
            file_size_bytes=len(content),
            mime_type=mime,
            caption=caption,
            display_order=len(existing),
            uploaded_by_email=actor_email,
        )
        self._session.add(asset)
        await self._session.flush()
        await self._session.refresh(asset)

        logger.info("Media asset uploaded", extra={"page_id": page.id, "asset_type": asset_type})
        return asset

    async def delete_asset(self, asset_id: str, recipient_id: str) -> None:
        """Delete a media asset from the database and local filesystem."""
        asset = await self._media_repo.get_by_id(asset_id)
        if not asset:
            raise NotFoundError(f"Media asset {asset_id!r} not found")

        page = await self._page_repo.get_by_recipient_id(recipient_id)
        if not page or asset.page_id != page.id:
            raise NotFoundError(f"Media asset {asset_id!r} does not belong to this recipient")

        if asset.blob_url and asset.blob_url.startswith(settings.UPLOADS_BASE_URL):
            path_suffix = asset.blob_url[len(settings.UPLOADS_BASE_URL):].lstrip("/")
            file_path = Path(settings.UPLOAD_DIR) / path_suffix
            if file_path.exists():
                file_path.unlink(missing_ok=True)

        await self._media_repo.delete(asset)
        logger.info("Media asset deleted", extra={"asset_id": asset_id})

    def _check_size(self, content: bytes) -> None:
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise ValidationError(
                f"File is too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB} MB."
            )
