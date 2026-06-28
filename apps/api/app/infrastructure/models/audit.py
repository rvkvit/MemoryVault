from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.recipient import Recipient


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    actor_email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    actor_entra_oid: Mapped[Optional[str]] = mapped_column(String(100))
    resource_type: Mapped[Optional[str]] = mapped_column(String(100))
    resource_id: Mapped[Optional[str]] = mapped_column(String(36))
    before_snapshot: Mapped[Optional[str]] = mapped_column(Text)  # JSON string
    after_snapshot: Mapped[Optional[str]] = mapped_column(Text)   # JSON string
    ip_hash: Mapped[Optional[str]] = mapped_column(String(64))
    correlation_id: Mapped[Optional[str]] = mapped_column(String(100))
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id!r} event={self.event_type!r}>"


class AccessAttempt(Base):
    """Immutable record of every authentication decision."""
    __tablename__ = "access_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    slug: Mapped[Optional[str]] = mapped_column(String(120))
    claimed_email: Mapped[Optional[str]] = mapped_column(String(320))
    intended_email: Mapped[Optional[str]] = mapped_column(String(320))
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)  # granted|denied|error
    denial_reason: Mapped[Optional[str]] = mapped_column(String(255))
    ip_hash: Mapped[Optional[str]] = mapped_column(String(64))
    user_agent_hash: Mapped[Optional[str]] = mapped_column(String(64))
    entra_oid: Mapped[Optional[str]] = mapped_column(String(100))
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<AccessAttempt outcome={self.outcome!r} slug={self.slug!r}>"


class OAuthState(Base):
    """Short-lived record holding PKCE state for the OAuth flow."""
    __tablename__ = "oauth_states"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    state_token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    code_verifier: Mapped[str] = mapped_column(String(128), nullable=False)
    nonce: Mapped[str] = mapped_column(String(64), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<OAuthState slug={self.slug!r} used={self.used!r}>"


class EmailDelivery(Base):
    __tablename__ = "email_deliveries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    recipient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(255))
    delivery_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    link_clicked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    bounce_reason: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    recipient: Mapped["Recipient"] = relationship("Recipient", back_populates="email_deliveries")

    def __repr__(self) -> str:
        return f"<EmailDelivery id={self.id!r} status={self.delivery_status!r}>"
