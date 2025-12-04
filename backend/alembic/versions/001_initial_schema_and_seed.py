"""Initial schema and seed data

Revision ID: 001_initial_schema_and_seed
Revises:
Create Date: 2024-12-04

"""

from collections.abc import Sequence
from datetime import UTC, datetime

import bcrypt
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema_and_seed"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def upgrade() -> None:
    now = datetime.now(UTC)

    # ===================
    # CREATE TABLES
    # ===================

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column(
            "role",
            sa.Enum("admin", "user", name="userrole"),
            default="user",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # Accounts table
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "account_type",
            sa.Enum(
                "caisse_epargne_joint",
                "caisse_epargne_seb",
                "caisse_epargne_marie",
                "n26_seb",
                name="accounttype",
            ),
            nullable=False,
        ),
        sa.Column("balance", sa.Numeric(12, 2), default=0.0),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_accounts_id", "accounts", ["id"])

    # Categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("color", sa.String(7), default="#6B7280"),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_categories_id", "categories", ["id"])

    # Projects table
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("current_amount", sa.Numeric(12, 2), default=0.0),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("is_completed", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projects_id", "projects", ["id"])

    # Expenses table
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "frequency",
            sa.Enum("one_time", "monthly", "quarterly", "annual", name="frequency"),
            default="one_time",
        ),
        sa.Column(
            "split_type",
            sa.Enum(
                "50_50",
                "33_67",
                "67_33",
                "100_marie",
                "100_seb",
                name="splittype",
            ),
            default="50_50",
        ),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("assigned_to", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"]),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
    )
    op.create_index("ix_expenses_id", "expenses", ["id"])

    # Project contributions table
    op.create_table(
        "project_contributions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("note", sa.String(500), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_project_contributions_id", "project_contributions", ["id"])

    # ===================
    # SEED DATA
    # ===================

    # Create default users (Seb and Marie) - Using raw SQL for ENUM compatibility
    seb_password = hash_password("changeme123")
    marie_password = hash_password("changeme123")
    now_str = now.isoformat()

    op.execute(
        f"""
        INSERT INTO users (id, email, username, hashed_password, full_name, is_active, role, created_at, updated_at)
        VALUES
            (1, 'seb@budget.local', 'seb', '{seb_password}', 'Seb', true, 'admin'::userrole, '{now_str}', '{now_str}'),
            (2, 'marie@budget.local', 'marie', '{marie_password}', 'Marie', true, 'user'::userrole, '{now_str}', '{now_str}')
        """
    )

    # Reset users sequence
    op.execute("SELECT setval('users_id_seq', 2, true)")

    # Create default accounts - Using raw SQL for ENUM compatibility
    op.execute(
        f"""
        INSERT INTO accounts (id, name, account_type, balance, description, is_active, created_at, updated_at)
        VALUES
            (1, 'Caisse d''Épargne Joint', 'caisse_epargne_joint'::accounttype, 0, 'Compte joint', true, '{now_str}', '{now_str}'),
            (2, 'Caisse d''Épargne Seb', 'caisse_epargne_seb'::accounttype, 0, 'Compte personnel Seb', true, '{now_str}', '{now_str}'),
            (3, 'Caisse d''Épargne Marie', 'caisse_epargne_marie'::accounttype, 0, 'Compte personnel Marie', true, '{now_str}', '{now_str}'),
            (4, 'N26 Seb', 'n26_seb'::accounttype, 0, 'Compte N26 Seb', true, '{now_str}', '{now_str}')
        """
    )

    # Reset accounts sequence
    op.execute("SELECT setval('accounts_id_seq', 4, true)")

    # Create default categories - no ENUM so bulk_insert works
    op.execute(
        f"""
        INSERT INTO categories (id, name, description, color, icon, is_active, created_at, updated_at)
        VALUES
            (1, 'Logement', 'Loyer, charges, assurance habitation', '#10B981', 'home', true, '{now_str}', '{now_str}'),
            (2, 'Alimentation', 'Courses, restaurants', '#F59E0B', 'utensils', true, '{now_str}', '{now_str}'),
            (3, 'Transports', 'Essence, transports en commun, entretien voiture', '#3B82F6', 'car', true, '{now_str}', '{now_str}'),
            (4, 'Abonnements', 'Netflix, Spotify, téléphone, internet', '#8B5CF6', 'tv', true, '{now_str}', '{now_str}'),
            (5, 'Santé', 'Médecin, pharmacie, mutuelle', '#EF4444', 'heart', true, '{now_str}', '{now_str}'),
            (6, 'Loisirs', 'Sorties, sport, voyages', '#EC4899', 'gamepad', true, '{now_str}', '{now_str}'),
            (7, 'Shopping', 'Vêtements, électronique, décoration', '#14B8A6', 'shopping-bag', true, '{now_str}', '{now_str}'),
            (8, 'Épargne', 'Virements épargne', '#6366F1', 'piggy-bank', true, '{now_str}', '{now_str}'),
            (9, 'Divers', 'Autres dépenses', '#6B7280', 'ellipsis', true, '{now_str}', '{now_str}')
        """
    )

    # Reset categories sequence
    op.execute("SELECT setval('categories_id_seq', 9, true)")


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table("project_contributions")
    op.drop_table("expenses")
    op.drop_table("projects")
    op.drop_table("categories")
    op.drop_table("accounts")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS accounttype")
    op.execute("DROP TYPE IF EXISTS frequency")
    op.execute("DROP TYPE IF EXISTS splittype")
