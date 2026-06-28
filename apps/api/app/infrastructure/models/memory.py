from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, new_uuid


class MemoryEntry(Base):
    """A memory left by a visitor on a farewell page."""
    __tablename__ = "memory_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    page_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recipient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("recipients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submitter_name: Mapped[str] = mapped_column(String(255), nullable=False)
    submitter_email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    voice_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    is_favourite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ip_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
