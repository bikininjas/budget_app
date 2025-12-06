"""Child expense model for tracking dependent user expenses (e.g., Emeline's purchases)."""

from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChildExpense(Base):
    """
    Child expense model for tracking purchases made by dependent users.

    Used for children/dependents with a monthly budget to track their spending.
    """

    __tablename__ = "child_expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    purchase_date: Mapped[date] = mapped_column(
        Date, default=lambda: datetime.now(UTC).date(), nullable=False
    )
    product_url: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Link for online purchases
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # Additional notes

    # Foreign Keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="child_expenses"
    )

    def __repr__(self) -> str:
        return f"<ChildExpense(id={self.id}, user_id={self.user_id}, amount={self.amount})>"
