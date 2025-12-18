"""Add budget association and carryover to child budgets and expenses

Revision ID: 008_add_budget_carryover
Revises: 007_add_child_monthly_budgets
Create Date: 2024-01-01 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "008_add_budget_carryover"
down_revision: str | None = "007_add_child_monthly_budgets"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add new fields to child_monthly_budgets table
    op.add_column(
        "child_monthly_budgets",
        sa.Column("carryover_amount", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
    )
    op.add_column(
        "child_monthly_budgets",
        sa.Column("is_exceptional", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "child_monthly_budgets",
        sa.Column("notes", sa.String(length=500), nullable=True),
    )

    # Add budget_id foreign key to child_expenses table
    op.add_column(
        "child_expenses",
        sa.Column("budget_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_child_expense_budget_id",
        "child_expenses",
        "child_monthly_budgets",
        ["budget_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    # Remove budget_id foreign key and column from child_expenses
    op.drop_constraint("fk_child_expense_budget_id", "child_expenses", type_="foreignkey")
    op.drop_column("child_expenses", "budget_id")

    # Remove new fields from child_monthly_budgets table
    op.drop_column("child_monthly_budgets", "notes")
    op.drop_column("child_monthly_budgets", "is_exceptional")
    op.drop_column("child_monthly_budgets", "carryover_amount")
