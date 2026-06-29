from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.recipient import Recipient


class InvitationToken(Base):
    """
    One invitation per recipient. Stores only the SHA-256 hash of the raw token.
    The raw token is generated once and sent to the recipient; it is never stored.
    """
    __tablename__ = "invitation_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    recipient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("recipients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    is_activated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    generation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # No back_populates on Recipient to avoid modifying the existing model
    recipient: Mapped["Recipient"] = relationship("Recipient", lazy="selectin", foreign_keys=[recipient_id])
    trusted_device: Mapped[Optional["TrustedDevice"]] = relationship(
        "TrustedDevice",
        back_populates="invitation",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class TrustedDevice(Base):
    """
    Fingerprint of the device that first activated an invitation.
    Returning visits from the same browser are authenticated via the device cookie.
    """
    __tablename__ = "trusted_devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    invitation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("invitation_tokens.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    recipient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("recipients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    fingerprint_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    first_visit_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_visit_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    visit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    invitation: Mapped["InvitationToken"] = relationship("InvitationToken", back_populates="trusted_device")
