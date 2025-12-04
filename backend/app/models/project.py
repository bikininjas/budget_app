"""Project model for budget tracking and savings goals."""

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    """Project model for tracking savings goals."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_completed: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="project")  # noqa: F821
    contributions: Mapped[list["ProjectContribution"]] = relationship(
        "ProjectContribution", back_populates="project"
    )

    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.target_amount == 0:
            return 0.0
        return float(self.current_amount / self.target_amount * 100)

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name})>"


class ProjectContribution(Base):
    """Model for tracking contributions to projects."""

    __tablename__ = "project_contributions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Foreign Keys
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="contributions")
    user: Mapped["User"] = relationship("User", back_populates="project_contributions")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ProjectContribution(id={self.id}, amount={self.amount})>"
