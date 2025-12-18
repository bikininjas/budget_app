"""add recurring_charges table

Revision ID: 003_add_recurring_charges
Revises: 002_add_is_recurring
Create Date: 2024-12-04

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_recurring_charges"
down_revision: str | None = "002_add_is_recurring"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "recurring_charges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "frequency",
            sa.String(20),
            nullable=False,
            server_default="monthly",
        ),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
    )
    op.create_index("ix_recurring_charges_category_id", "recurring_charges", ["category_id"])


def downgrade() -> None:
    op.drop_index("ix_recurring_charges_category_id", table_name="recurring_charges")
    op.drop_table("recurring_charges")
