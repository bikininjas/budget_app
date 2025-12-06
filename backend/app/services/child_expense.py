"""Service layer for child expense operations."""

from datetime import date
from decimal import Decimal

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.child_expense import ChildExpense
from app.models.user import User
from app.schemas.child_expense import (
    ChildExpenseCreate,
    ChildExpenseSummary,
    ChildExpenseUpdate,
)


class ChildExpenseService:
    """Service for managing child expenses."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ChildExpenseCreate) -> ChildExpense:
        """Create a new child expense."""
        expense = ChildExpense(**data.model_dump())
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def get_by_id(self, expense_id: int) -> ChildExpense | None:
        """Get a child expense by ID."""
        result = await self.db.execute(
            select(ChildExpense)
            .options(joinedload(ChildExpense.user))
            .where(ChildExpense.id == expense_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self,
        user_id: int,
        month: int | None = None,
        year: int | None = None,
    ) -> list[ChildExpense]:
        """Get all expenses for a specific user, optionally filtered by month/year."""
        query = select(ChildExpense).where(ChildExpense.user_id == user_id)

        if month and year:
            query = query.where(
                extract("month", ChildExpense.purchase_date) == month,
                extract("year", ChildExpense.purchase_date) == year,
            )
        elif year:
            query = query.where(extract("year", ChildExpense.purchase_date) == year)

        query = query.order_by(ChildExpense.purchase_date.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all(self) -> list[ChildExpense]:
        """Get all child expenses."""
        result = await self.db.execute(
            select(ChildExpense)
            .options(joinedload(ChildExpense.user))
            .order_by(ChildExpense.purchase_date.desc())
        )
        return list(result.scalars().all())

    async def update(self, expense_id: int, data: ChildExpenseUpdate) -> ChildExpense | None:
        """Update a child expense."""
        expense = await self.get_by_id(expense_id)
        if not expense:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(expense, field, value)

        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense_id: int) -> bool:
        """Delete a child expense."""
        expense = await self.get_by_id(expense_id)
        if not expense:
            return False

        await self.db.delete(expense)
        await self.db.commit()
        return True

    async def get_summary(
        self, user_id: int, month: int | None = None, year: int | None = None
    ) -> ChildExpenseSummary:
        """Get expense summary for a child user including budget tracking."""
        # Get user with monthly budget
        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        # Default to current month/year if not specified
        today = date.today()
        month = month or today.month
        year = year or today.year

        # Calculate total spent in the specified period
        query = select(func.sum(ChildExpense.amount)).where(
            ChildExpense.user_id == user_id,
            extract("month", ChildExpense.purchase_date) == month,
            extract("year", ChildExpense.purchase_date) == year,
        )
        result = await self.db.execute(query)
        total_spent = result.scalar_one() or Decimal("0.00")

        # Count expenses
        count_query = select(func.count(ChildExpense.id)).where(
            ChildExpense.user_id == user_id,
            extract("month", ChildExpense.purchase_date) == month,
            extract("year", ChildExpense.purchase_date) == year,
        )
        count_result = await self.db.execute(count_query)
        expense_count = count_result.scalar_one()

        # Calculate remaining budget
        remaining_budget = None
        if user.monthly_budget:
            remaining_budget = user.monthly_budget - total_spent

        return ChildExpenseSummary(
            user_id=user.id,
            username=user.username,
            monthly_budget=user.monthly_budget,
            total_spent=total_spent,
            remaining_budget=remaining_budget,
            expense_count=expense_count,
            current_month=f"{year}-{month:02d}",
        )
