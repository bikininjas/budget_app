"""add password_set field to users

Revision ID: add_password_set
Revises: add_recurring_charges
Create Date: 2024-01-20

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_password_set"
down_revision: str | None = "add_recurring_charges"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add password_set column with default True for existing users
    # (they already have passwords set)
    op.add_column(
        "users", sa.Column("password_set", sa.Boolean(), nullable=False, server_default="true")
    )


def downgrade() -> None:
    op.drop_column("users", "password_set")
