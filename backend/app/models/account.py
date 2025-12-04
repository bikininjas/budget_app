"""Account model for bank accounts."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AccountType(str, PyEnum):
    """Types of bank accounts."""

    caisse_epargne_joint = "caisse_epargne_joint"
    caisse_epargne_seb = "caisse_epargne_seb"
    caisse_epargne_marie = "caisse_epargne_marie"
    n26_seb = "n26_seb"


class Account(Base):
    """Bank account model."""

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
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
        "Expense", back_populates="account"
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name={self.name}, type={self.account_type})>"
