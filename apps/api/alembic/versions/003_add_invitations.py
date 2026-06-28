"""Add invitation_tokens and trusted_devices tables

Revision ID: 003
Revises: 002
Create Date: 2026-06-28
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "invitation_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("recipient_id", sa.String(36), sa.ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column("is_activated", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "trusted_devices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("invitation_id", sa.String(36), sa.ForeignKey("invitation_tokens.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("recipient_id", sa.String(36), sa.ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("device_token_hash", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column("fingerprint_hash", sa.String(64), nullable=False),
        sa.Column("first_visit_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_visit_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("visit_count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("user_agent", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("trusted_devices")
    op.drop_table("invitation_tokens")
