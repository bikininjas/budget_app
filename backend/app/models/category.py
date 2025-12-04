"""Category model for expense categorization."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    """Expense category model."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    color: Mapped[str] = mapped_column(String(7), default="#6B7280")  # Hex color
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Icon name
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
    expenses: Mapped[list["Expense"]] = relationship(  # noqa: F821
        "Expense", back_populates="category"
    )
    recurring_charges: Mapped[list["RecurringCharge"]] = relationship(  # noqa: F821
        "RecurringCharge", back_populates="category"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name})>"
