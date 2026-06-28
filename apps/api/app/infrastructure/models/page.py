from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.recipient import Recipient
    from app.infrastructure.models.guestbook import GuestbookEntry


class Page(Base, TimestampMixin):
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    recipient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recipients.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    personalized_message: Mapped[Optional[str]] = mapped_column(Text)
    theme: Mapped[str] = mapped_column(String(50), default="midnight-blue", nullable=False)
    show_guestbook: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_timeline: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_photos: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_video: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    recipient: Mapped["Recipient"] = relationship("Recipient", back_populates="page")
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent",
        back_populates="page",
        cascade="all, delete-orphan",
        order_by="TimelineEvent.display_order",
        lazy="select",
    )
    media_assets: Mapped[list["MediaAsset"]] = relationship(
        "MediaAsset",
        back_populates="page",
        cascade="all, delete-orphan",
        order_by="MediaAsset.display_order",
        lazy="select",
    )
    guestbook_entries: Mapped[list["GuestbookEntry"]] = relationship(
        "GuestbookEntry",
        back_populates="page",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Page id={self.id!r} recipient_id={self.recipient_id!r}>"


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    page_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO date string
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon: Mapped[Optional[str]] = mapped_column(String(100))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    page: Mapped["Page"] = relationship("Page", back_populates="timeline_events")

    def __repr__(self) -> str:
        return f"<TimelineEvent id={self.id!r} title={self.title!r}>"


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    page_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    asset_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'photo' | 'video'
    blob_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    cdn_url: Mapped[Optional[str]] = mapped_column(String(2048))
    thumbnail_cdn_url: Mapped[Optional[str]] = mapped_column(String(2048))
    caption: Mapped[Optional[str]] = mapped_column(String(500))
    file_name: Mapped[Optional[str]] = mapped_column(String(500))
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))
    width_px: Mapped[Optional[int]] = mapped_column(Integer)
    height_px: Mapped[Optional[int]] = mapped_column(Integer)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploaded_by_email: Mapped[str] = mapped_column(String(320), nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    page: Mapped["Page"] = relationship("Page", back_populates="media_assets")

    def __repr__(self) -> str:
        return f"<MediaAsset id={self.id!r} type={self.asset_type!r}>"
