"""make expense assigned_to nullable for common expenses

Revision ID: make_assigned_to_nullable
Revises: add_child_user_and_expenses
Create Date: 2024-12-06

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "make_assigned_to_nullable"
down_revision: str | None = "add_child_user_and_expenses"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Make assigned_to nullable to support common expenses (not assigned to a specific user)
    op.alter_column(
        "expenses",
        "assigned_to",
        existing_type=sa.INTEGER(),
        nullable=True,
    )


def downgrade() -> None:
    # Revert: make assigned_to NOT NULL again
    # Note: This will fail if there are NULL values in the column
    op.alter_column(
        "expenses",
        "assigned_to",
        existing_type=sa.INTEGER(),
        nullable=False,
    )
