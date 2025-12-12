"""Child monthly budget model for tracking monthly budget allocations per child user."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChildMonthlyBudget(Base):
    """
    Model for tracking monthly budget allocations for child users.

    Allows setting different budgets for different months.
    For example, Emeline might have 40€ in January but 50€ in December.
    """

    __tablename__ = "child_monthly_budgets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-12
    budget_amount: Mapped[object] = mapped_column(Numeric(12, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    user: Mapped["User"] = relationship("User")  # noqa: F821

    # Unique constraint: only one budget per user per month
    __table_args__ = (UniqueConstraint("user_id", "year", "month", name="uq_user_month_budget"),)

    def __repr__(self) -> str:
        return f"<ChildMonthlyBudget(user_id={self.user_id}, {self.year}-{self.month:02d}, amount={self.budget_amount})>"
