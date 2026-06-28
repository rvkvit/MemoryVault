"""Add memory_entries table

Revision ID: 004
Revises: 003
Create Date: 2026-06-28
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "memory_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("page_id", sa.String(36), sa.ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("recipient_id", sa.String(36), sa.ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("submitter_name", sa.String(255), nullable=False),
        sa.Column("submitter_email", sa.String(320), nullable=True),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("voice_url", sa.String(2048), nullable=True),
        sa.Column("image_url", sa.String(2048), nullable=True),
        sa.Column("is_favourite", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("is_hidden", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("memory_entries")
