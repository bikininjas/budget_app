"""User model for authentication and user management."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, PyEnum):
    """User roles for authorization."""

    admin = "admin"
    user = "user"


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    password_set: Mapped[bool] = mapped_column(Boolean, default=False)  # True when user has set their own password
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship(  # noqa: F821
        "Expense", back_populates="assigned_user", foreign_keys="Expense.assigned_to"
    )
    created_expenses: Mapped[list["Expense"]] = relationship(  # noqa: F821
        "Expense", back_populates="creator", foreign_keys="Expense.created_by"
    )
    project_contributions: Mapped[list["ProjectContribution"]] = relationship(  # noqa: F821
        "ProjectContribution", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username})>"
