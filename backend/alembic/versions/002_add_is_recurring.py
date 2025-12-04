"""add is_recurring to expenses

Revision ID: add_is_recurring
Revises: 001_initial_schema_and_seed
Create Date: 2024-12-04

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_is_recurring"
down_revision: str | None = "001_initial_schema_and_seed"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add is_recurring column to expenses table
    op.add_column(
        "expenses", sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default="false")
    )


def downgrade() -> None:
    op.drop_column("expenses", "is_recurring")
