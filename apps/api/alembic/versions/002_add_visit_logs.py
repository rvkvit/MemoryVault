"""Add visit_logs table for detailed visit tracking

Revision ID: 002
Revises: 001
Create Date: 2026-06-28
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "visit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("page_id", sa.String(36), sa.ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("recipient_id", sa.String(36), sa.ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("browser", sa.String(50), nullable=False, server_default="Other"),
        sa.Column("device_type", sa.String(20), nullable=False, server_default="Desktop"),
        sa.Column("raw_user_agent", sa.Text, nullable=True),
        sa.Column("duration_seconds", sa.Integer, nullable=False, server_default="0"),
        sa.Column("referrer", sa.String(2048), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("last_ping_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("visit_logs")
