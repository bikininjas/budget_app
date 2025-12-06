"""Expense model for tracking expenses."""

from datetime import UTC, date, datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SplitType(str, PyEnum):
    """How the expense is split between users."""

    fifty_fifty = "50_50"  # 50/50 split
    one_third_two_thirds = "33_67"  # 1/3 - 2/3 split
    two_thirds_one_third = "67_33"  # 2/3 - 1/3 split
    full_marie = "100_marie"  # 100% Marie
    full_seb = "100_seb"  # 100% Seb


class Frequency(str, PyEnum):
    """Expense frequency for recurring expenses."""

    one_time = "one_time"
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class Expense(Base):
    """Expense model for tracking all expenses."""

    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, default=lambda: datetime.now(UTC).date())
    frequency: Mapped[Frequency] = mapped_column(
        Enum(Frequency, values_callable=lambda x: [e.value for e in x]), default=Frequency.one_time
    )
    split_type: Mapped[SplitType] = mapped_column(
        Enum(SplitType, values_callable=lambda x: [e.value for e in x]),
        default=SplitType.fifty_fifty,
    )

    # Foreign Keys
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    assigned_to: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)

    # Recurring expense flag
    is_recurring: Mapped[bool] = mapped_column(default=False)

    # Metadata
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="expenses")  # noqa: F821
    account: Mapped["Account"] = relationship("Account", back_populates="expenses")  # noqa: F821
    assigned_user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="expenses", foreign_keys=[assigned_to]
    )
    creator: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="created_expenses", foreign_keys=[created_by]
    )
    project: Mapped["Project | None"] = relationship(  # noqa: F821
        "Project", back_populates="expenses"
    )

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, label={self.label}, amount={self.amount})>"
