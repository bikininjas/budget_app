"""Service layer for child expense operations."""

from datetime import date
from decimal import Decimal

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.child_expense import ChildExpense
from app.models.child_monthly_budget import ChildMonthlyBudget
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
        """Create a new child expense and automatically associate with monthly budget."""
        # If no budget_id provided, try to find the appropriate monthly budget
        if data.budget_id is None:
            # Find the budget for the month/year of the expense
            budget_result = await self.db.execute(
                select(ChildMonthlyBudget).where(
                    ChildMonthlyBudget.user_id == data.user_id,
                    ChildMonthlyBudget.year == data.purchase_date.year,
                    ChildMonthlyBudget.month == data.purchase_date.month,
                )
            )
            budget = budget_result.scalar_one_or_none()

            if budget:
                # Associate expense with the found budget
                expense_data = data.model_dump()
                expense_data["budget_id"] = budget.id
                expense = ChildExpense(**expense_data)
            else:
                # No budget found for this month, create expense without budget association
                expense = ChildExpense(**data.model_dump())
        else:
            # Use the provided budget_id
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
        """Get expense summary for a child user including budget tracking with carryover support."""
        import logging
        logger = logging.getLogger(__name__)

        logger.debug(f"📊 Generating summary for user {user_id}, month {month}, year {year}")
        try:
            # Get user
            logger.debug(f"👤 Looking up user {user_id}")
            user_result = await self.db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()

            if not user:
                logger.warn(f"⚠️  User not found: {user_id}")
                raise ValueError(f"User {user_id} not found")

        except Exception as e:
            # Log the error and return a safe default response
            from app.core.config import settings

            if hasattr(settings, "debug") and settings.debug:
                print(f"Error in get_summary: {str(e)}")

            # Return default values to prevent 500 errors
            return ChildExpenseSummary(
                user_id=user_id,
                username=f"user_{user_id}",
                monthly_budget=Decimal("0.00"),
                carryover_amount=Decimal("0.00"),
                total_available_budget=Decimal("0.00"),
                total_spent=Decimal("0.00"),
                remaining_budget=Decimal("0.00"),
                carryover_to_next=Decimal("0.00"),
                is_exceptional=False,
                expense_count=0,
                current_month=f"{year or date.today().year}-{month or date.today().month:02d}",
            )

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

        # Get monthly budget for the specified month/year (if it exists)
        budget_result = await self.db.execute(
            select(ChildMonthlyBudget).where(
                ChildMonthlyBudget.user_id == user_id,
                ChildMonthlyBudget.year == year,
                ChildMonthlyBudget.month == month,
            )
        )
        monthly_budget_record = budget_result.scalar_one_or_none()

        # Calculate available budget (base budget + carryover)
        monthly_budget = None
        carryover_amount = Decimal("0.00")
        is_exceptional = False

        if monthly_budget_record:
            monthly_budget = monthly_budget_record.base_amount
            carryover_amount = monthly_budget_record.carryover_amount
            is_exceptional = monthly_budget_record.is_exceptional
        elif user.monthly_budget:
            # Fallback to user's default monthly budget for backward compatibility
            monthly_budget = user.monthly_budget

        # Calculate total available budget (base + carryover)
        total_available_budget = None
        if monthly_budget:
            total_available_budget = monthly_budget + carryover_amount

        # Calculate remaining budget
        remaining_budget = None
        if total_available_budget:
            remaining_budget = total_available_budget - total_spent

        # Calculate carryover to next month (if remaining budget is positive)
        carryover_to_next = None
        if remaining_budget and remaining_budget > 0:
            carryover_to_next = remaining_budget

        return ChildExpenseSummary(
            user_id=user.id,
            username=user.username,
            monthly_budget=monthly_budget,
            carryover_amount=carryover_amount,
            total_available_budget=total_available_budget,
            total_spent=total_spent,
            remaining_budget=remaining_budget,
            carryover_to_next=carryover_to_next,
            is_exceptional=is_exceptional,
            expense_count=expense_count,
            current_month=f"{year}-{month:02d}",
        )
