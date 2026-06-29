"""Add generation_count to invitation_tokens

Revision ID: 005
Revises: 004
Create Date: 2026-06-29
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "invitation_tokens",
        sa.Column("generation_count", sa.Integer, nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("invitation_tokens", "generation_count")
