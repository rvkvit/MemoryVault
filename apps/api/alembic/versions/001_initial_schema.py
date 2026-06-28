"""Initial schema — all tables

Revision ID: 001
Revises:
Create Date: 2026-06-27
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── recipients ────────────────────────────────────────────────────────────
    op.create_table(
        "recipients",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("job_title", sa.String(255)),
        sa.Column("department", sa.String(255)),
        sa.Column("team", sa.String(255)),
        sa.Column("manager_email", sa.String(320)),
        sa.Column("avatar_blob_url", sa.String(2048)),
        sa.Column("hire_date", sa.String(10)),
        sa.Column("last_day", sa.String(10)),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", sa.String(320), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_recipients_email", "recipients", ["email"], unique=True)
    op.create_index("ix_recipients_slug", "recipients", ["slug"], unique=True)

    # ── pages ─────────────────────────────────────────────────────────────────
    op.create_table(
        "pages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "recipient_id", sa.String(36),
            sa.ForeignKey("recipients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("personalized_message", sa.Text),
        sa.Column("theme", sa.String(50), nullable=False, server_default="midnight-blue"),
        sa.Column("show_guestbook", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("show_timeline", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("show_photos", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("show_video", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("is_published", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("view_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("recipient_id", name="uq_pages_recipient_id"),
    )

    # ── timeline_events ───────────────────────────────────────────────────────
    op.create_table(
        "timeline_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "page_id", sa.String(36),
            sa.ForeignKey("pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_date", sa.String(10), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("icon", sa.String(100)),
        sa.Column("display_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_timeline_events_page_id", "timeline_events", ["page_id"])

    # ── media_assets ──────────────────────────────────────────────────────────
    op.create_table(
        "media_assets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "page_id", sa.String(36),
            sa.ForeignKey("pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("asset_type", sa.String(10), nullable=False),
        sa.Column("blob_url", sa.String(2048), nullable=False),
        sa.Column("cdn_url", sa.String(2048)),
        sa.Column("thumbnail_cdn_url", sa.String(2048)),
        sa.Column("caption", sa.String(500)),
        sa.Column("file_name", sa.String(500)),
        sa.Column("file_size_bytes", sa.Integer),
        sa.Column("mime_type", sa.String(100)),
        sa.Column("width_px", sa.Integer),
        sa.Column("height_px", sa.Integer),
        sa.Column("duration_seconds", sa.Integer),
        sa.Column("display_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("uploaded_by_email", sa.String(320), nullable=False),
        sa.Column("is_approved", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_media_assets_page_id", "media_assets", ["page_id"])

    # ── guestbook_entries ─────────────────────────────────────────────────────
    op.create_table(
        "guestbook_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "page_id", sa.String(36),
            sa.ForeignKey("pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("author_email", sa.String(320), nullable=False),
        sa.Column("author_display_name", sa.String(255), nullable=False),
        sa.Column("author_avatar_url", sa.String(2048)),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("reaction_emoji", sa.String(10)),
        sa.Column("is_hidden", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("ip_hash", sa.String(64)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_guestbook_entries_page_id", "guestbook_entries", ["page_id"])
    op.create_index("ix_guestbook_entries_created_at", "guestbook_entries", ["created_at"])

    # ── audit_log ─────────────────────────────────────────────────────────────
    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("actor_email", sa.String(320), nullable=False),
        sa.Column("actor_entra_oid", sa.String(100)),
        sa.Column("resource_type", sa.String(100)),
        sa.Column("resource_id", sa.String(36)),
        sa.Column("before_snapshot", sa.Text),
        sa.Column("after_snapshot", sa.Text),
        sa.Column("ip_hash", sa.String(64)),
        sa.Column("correlation_id", sa.String(100)),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_log_event_type", "audit_log", ["event_type"])
    op.create_index("ix_audit_log_actor_email", "audit_log", ["actor_email"])
    op.create_index("ix_audit_log_occurred_at", "audit_log", ["occurred_at"])

    # ── access_attempts ───────────────────────────────────────────────────────
    op.create_table(
        "access_attempts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(120)),
        sa.Column("claimed_email", sa.String(320)),
        sa.Column("intended_email", sa.String(320)),
        sa.Column("outcome", sa.String(20), nullable=False),
        sa.Column("denial_reason", sa.String(255)),
        sa.Column("ip_hash", sa.String(64)),
        sa.Column("user_agent_hash", sa.String(64)),
        sa.Column("entra_oid", sa.String(100)),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_access_attempts_attempted_at", "access_attempts", ["attempted_at"])

    # ── oauth_states ──────────────────────────────────────────────────────────
    op.create_table(
        "oauth_states",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("state_token", sa.String(128), nullable=False),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("code_verifier", sa.String(128), nullable=False),
        sa.Column("nonce", sa.String(64), nullable=False),
        sa.Column("used", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_oauth_states_state_token", "oauth_states", ["state_token"], unique=True)

    # ── email_deliveries ──────────────────────────────────────────────────────
    op.create_table(
        "email_deliveries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "recipient_id", sa.String(36),
            sa.ForeignKey("recipients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider_message_id", sa.String(255)),
        sa.Column("delivery_status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("opened_at", sa.DateTime(timezone=True)),
        sa.Column("link_clicked_at", sa.DateTime(timezone=True)),
        sa.Column("bounce_reason", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_email_deliveries_recipient_id", "email_deliveries", ["recipient_id"])


def downgrade() -> None:
    op.drop_table("email_deliveries")
    op.drop_table("oauth_states")
    op.drop_table("access_attempts")
    op.drop_table("audit_log")
    op.drop_table("guestbook_entries")
    op.drop_table("media_assets")
    op.drop_table("timeline_events")
    op.drop_table("pages")
    op.drop_table("recipients")
