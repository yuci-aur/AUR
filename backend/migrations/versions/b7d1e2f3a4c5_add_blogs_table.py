"""add blogs table

Revision ID: b7d1e2f3a4c5
Revises: 3d7e430f3766
Create Date: 2026-07-24 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b7d1e2f3a4c5'
down_revision: Union[str, Sequence[str], None] = '3d7e430f3766'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the blogs table (idempotent — skips if it already exists)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "blogs" in inspector.get_table_names():
        return

    op.create_table(
        "blogs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="Draft", nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("cover_image", sa.String(), nullable=True),
        sa.Column("author", sa.String(length=100), nullable=True),
        sa.Column("read_time", sa.String(length=50), nullable=True),
        sa.Column("tags", sa.String(), nullable=True),
        sa.Column("featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("publish_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_blogs_slug"), "blogs", ["slug"], unique=True)


def downgrade() -> None:
    """Drop the blogs table."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "blogs" not in inspector.get_table_names():
        return
    op.drop_index(op.f("ix_blogs_slug"), table_name="blogs")
    op.drop_table("blogs")
