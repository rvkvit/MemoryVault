from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.page import Page


class GuestbookEntry(Base):
    __tablename__ = "guestbook_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    page_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_email: Mapped[str] = mapped_column(String(320), nullable=False)
    author_display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_avatar_url: Mapped[Optional[str]] = mapped_column(String(2048))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    reaction_emoji: Mapped[Optional[str]] = mapped_column(String(10))
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ip_hash: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    page: Mapped["Page"] = relationship("Page", back_populates="guestbook_entries")

    def __repr__(self) -> str:
        return f"<GuestbookEntry id={self.id!r} author={self.author_email!r}>"
