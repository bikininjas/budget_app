"""add child_monthly_budgets table for monthly budget tracking

Revision ID: 007_add_child_monthly_budgets
Revises: 006_make_assigned_to_nullable
Create Date: 2025-01-10

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007_add_child_monthly_budgets"
down_revision: str | None = "006_make_assigned_to_nullable"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create child_monthly_budgets table
    op.create_table(
        "child_monthly_budgets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("budget_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "year", "month", name="uq_user_month_budget"),
    )
    op.create_index(
        op.f("ix_child_monthly_budgets_id"), "child_monthly_budgets", ["id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_child_monthly_budgets_id"), table_name="child_monthly_budgets")
    op.drop_table("child_monthly_budgets")
