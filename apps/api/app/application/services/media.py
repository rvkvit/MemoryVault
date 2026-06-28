from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import cloudinary_client
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
        """Upload an avatar image to Cloudinary. Returns the public CDN URL."""
        recipient = await self._recipient_repo.get_by_id(recipient_id)
        if not recipient:
            raise NotFoundError(f"Recipient {recipient_id!r} not found")

        mime = file.content_type or ""
        if mime not in _ALLOWED_IMAGE:
            raise ValidationError(f"Avatar must be an image (jpeg/png/webp/gif). Received: {mime!r}")

        content = await file.read()
        self._check_size(content)

        result = await cloudinary_client.upload(
            content,
            folder="memoryvault/avatars",
            resource_type="image",
        )
        url = result["secure_url"]

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
        """Upload a photo or video to Cloudinary and link it to the recipient's page."""
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
        cld_resource_type = "image" if asset_type == "photo" else "video"

        content = await file.read()
        self._check_size(content)

        folder = f"memoryvault/{'photos' if asset_type == 'photo' else 'videos'}"
        result = await cloudinary_client.upload(
            content,
            folder=folder,
            resource_type=cld_resource_type,
        )

        existing = await self._media_repo.get_by_page(page.id)
        asset = MediaAsset(
            page_id=page.id,
            asset_type=asset_type,
            # blob_url stores the Cloudinary public_id for later deletion
            blob_url=result["public_id"],
            # cdn_url stores the https URL served to users
            cdn_url=result["secure_url"],
            file_name=file.filename,
            file_size_bytes=result.get("bytes"),
            mime_type=mime,
            caption=caption,
            display_order=len(existing),
            uploaded_by_email=actor_email,
        )
        self._session.add(asset)
        await self._session.flush()

        logger.info("Media asset uploaded", extra={"page_id": page.id, "asset_type": asset_type})
        return asset

    async def delete_asset(self, asset_id: str, recipient_id: str) -> None:
        """Delete a media asset from Cloudinary and the database."""
        asset = await self._media_repo.get_by_id(asset_id)
        if not asset:
            raise NotFoundError(f"Media asset {asset_id!r} not found")

        page = await self._page_repo.get_by_recipient_id(recipient_id)
        if not page or asset.page_id != page.id:
            raise NotFoundError(f"Media asset {asset_id!r} does not belong to this recipient")

        # blob_url holds the Cloudinary public_id after the migration to cloud storage
        if asset.blob_url:
            cld_resource_type = "image" if asset.asset_type == "photo" else "video"
            await cloudinary_client.destroy(asset.blob_url, resource_type=cld_resource_type)

        await self._media_repo.delete(asset)
        logger.info("Media asset deleted", extra={"asset_id": asset_id})

    def _check_size(self, content: bytes) -> None:
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise ValidationError(
                f"File is too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB} MB."
            )
