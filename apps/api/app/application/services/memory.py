from __future__ import annotations

import csv
import hashlib
import io
from datetime import datetime, timezone
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import cloudinary_client
from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.log import get_logger
from app.infrastructure.models.memory import MemoryEntry
from app.infrastructure.repositories.memory import MemoryRepository

logger = get_logger(__name__)

_ALLOWED_AUDIO = {"audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"}
_ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_VOICE_MB  = 20
_MAX_IMAGE_MB  = 10


class MemoryService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = MemoryRepository(db)

    async def create(
        self,
        *,
        page_id: str,
        recipient_id: str,
        submitter_name: str,
        submitter_email: Optional[str],
        message: str,
        voice_file: Optional[UploadFile],
        image_file: Optional[UploadFile],
        client_ip: str,
    ) -> MemoryEntry:
        voice_url = None
        image_url = None

        if voice_file and voice_file.filename:
            voice_url = await self._upload_to_cloudinary(
                voice_file, "memoryvault/voices", _ALLOWED_AUDIO, _MAX_VOICE_MB,
                resource_type="video",  # Cloudinary classifies audio under "video"
            )

        if image_file and image_file.filename:
            image_url = await self._upload_to_cloudinary(
                image_file, "memoryvault/memories", _ALLOWED_IMAGE, _MAX_IMAGE_MB,
                resource_type="image",
            )

        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest() if client_ip else None

        entry = MemoryEntry(
            page_id=page_id,
            recipient_id=recipient_id,
            submitter_name=submitter_name.strip(),
            submitter_email=submitter_email.lower().strip() if submitter_email else None,
            message=message.strip(),
            voice_url=voice_url,
            image_url=image_url,
            ip_hash=ip_hash,
            created_at=datetime.now(timezone.utc),
        )
        return await self._repo.create(entry)

    async def list_for_recipient(
        self,
        recipient_id: str,
        *,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        favourites_only: bool = False,
    ):
        return await self._repo.list_for_recipient(
            recipient_id,
            skip=skip,
            limit=limit,
            search=search,
            favourites_only=favourites_only,
        )

    async def toggle_favourite(self, entry_id: str) -> MemoryEntry:
        entry = await self._repo.toggle_favourite(entry_id)
        if not entry:
            raise NotFoundError("Memory entry not found.")
        return entry

    async def hide(self, entry_id: str) -> None:
        await self._repo.hide(entry_id)

    async def export_csv_by_recipient(self, recipient_id: str) -> str:
        entries = await self._repo.list_all_by_recipient(recipient_id)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "Date", "Name", "Email", "Message",
            "Has Voice", "Has Image", "Favourite",
        ])
        for e in entries:
            writer.writerow([
                e.created_at.isoformat() if e.created_at else "",
                e.submitter_name,
                e.submitter_email or "",
                e.message,
                "Yes" if e.voice_url else "No",
                "Yes" if e.image_url else "No",
                "Yes" if e.is_favourite else "No",
            ])
        return buf.getvalue()

    async def _upload_to_cloudinary(
        self,
        upload: UploadFile,
        folder: str,
        allowed_types: set[str],
        max_mb: int,
        *,
        resource_type: str,
    ) -> str:
        content_type = (upload.content_type or "").lower()
        if content_type not in allowed_types:
            raise ValidationError(f"File type '{content_type}' is not allowed.")

        data = await upload.read()
        max_bytes = max_mb * 1024 * 1024
        if len(data) > max_bytes:
            raise ValidationError(f"File exceeds {max_mb} MB limit.")

        result = await cloudinary_client.upload(
            data,
            folder=folder,
            resource_type=resource_type,
        )
        return result["secure_url"]
