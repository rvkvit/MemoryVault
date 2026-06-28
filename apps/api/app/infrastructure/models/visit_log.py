from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.models.base import Base, new_uuid


class VisitLog(Base):
    __tablename__ = "visit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    page_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Denormalized for efficient GROUP BY without joining to pages
    recipient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    browser: Mapped[str] = mapped_column(String(50), nullable=False, default="Other")
    device_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Desktop")
    raw_user_agent: Mapped[Optional[str]] = mapped_column(Text)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    referrer: Mapped[Optional[str]] = mapped_column(String(2048))
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    last_ping_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<VisitLog id={self.id!r} page_id={self.page_id!r}>"
