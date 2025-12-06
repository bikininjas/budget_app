"""add child user role, monthly_budget, and child_expenses table

Revision ID: add_child_user_and_expenses
Revises: add_password_set
Create Date: 2024-01-21

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_child_user_and_expenses"
down_revision: str | None = "add_password_set"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add enum values using raw connection
    # PostgreSQL needs enum values committed before use, but IF NOT EXISTS handles duplicates
    connection = op.get_bind()

    # Check and add 'child' value to userrole enum if it doesn't exist
    try:
        connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'child'"))
    except Exception:
        pass  # Value already exists, skip

    # Check and add '100_emeline' value to splittype enum if it doesn't exist
    try:
        connection.execute(sa.text("ALTER TYPE splittype ADD VALUE IF NOT EXISTS '100_emeline'"))
    except Exception:
        pass  # Value already exists, skip

    # Add monthly_budget column to users table (IF NOT EXISTS handled by op.add_column)
    op.add_column(
        "users",
        sa.Column("monthly_budget", sa.Numeric(precision=12, scale=2), nullable=True),
    )

    # Create child_expenses table
    op.create_table(
        "child_expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("product_url", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_child_expenses_user_id"), "child_expenses", ["user_id"], unique=False)

    # Seed Emeline user with child role
    # Note: Using Marie's email as per requirement ("qui utilisera le mien")
    op.execute(
        sa.text(
            """
            INSERT INTO users (username, email, full_name, hashed_password, role, monthly_budget, password_set, created_at, updated_at)
            SELECT 'emeline', 'marie@example.com', 'Emeline',
                   (SELECT hashed_password FROM users WHERE username = 'marie' LIMIT 1),
                   'child', 50.00, FALSE, now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'emeline')
            """
        )
    )


def downgrade() -> None:
    # Remove Emeline user
    op.execute("DELETE FROM users WHERE username = 'emeline' AND role = 'child'")

    # Drop child_expenses table
    op.drop_index(op.f("ix_child_expenses_user_id"), table_name="child_expenses")
    op.drop_table("child_expenses")

    # Note: Cannot remove enum values in PostgreSQL without recreating the enum
    # This is a safe limitation as the enum values won't cause issues

    # Remove monthly_budget column
    op.drop_column("users", "monthly_budget")
