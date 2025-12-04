"""Recurring charge model for budget planning."""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChargeFrequency(str, Enum):
    """Frequency of recurring charges."""

    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class RecurringCharge(Base):
    """Model for recurring/fixed charges (budget planning)."""

    __tablename__ = "recurring_charges"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    frequency: Mapped[str] = mapped_column(String(20), default="monthly")
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    category: Mapped["Category"] = relationship(back_populates="recurring_charges")  # noqa: F821
