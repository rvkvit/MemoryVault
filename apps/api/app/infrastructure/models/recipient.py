from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.page import Page
    from app.infrastructure.models.audit import EmailDelivery


class Recipient(Base, TimestampMixin):
    __tablename__ = "recipients"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=new_uuid
    )
    slug: Mapped[str] = mapped_column(
        String(120), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    job_title: Mapped[Optional[str]] = mapped_column(String(255))
    department: Mapped[Optional[str]] = mapped_column(String(255))
    team: Mapped[Optional[str]] = mapped_column(String(255))
    manager_email: Mapped[Optional[str]] = mapped_column(String(320))
    avatar_blob_url: Mapped[Optional[str]] = mapped_column(String(2048))
    hire_date: Mapped[Optional[date]] = mapped_column(Date)
    last_day: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[str] = mapped_column(String(320), nullable=False)

    # Relationships
    page: Mapped[Optional["Page"]] = relationship(
        "Page", back_populates="recipient", uselist=False, lazy="select"
    )
    email_deliveries: Mapped[list["EmailDelivery"]] = relationship(
        "EmailDelivery", back_populates="recipient", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Recipient id={self.id!r} email={self.email!r}>"
