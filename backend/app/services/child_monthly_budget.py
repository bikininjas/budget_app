"""Service layer for child monthly budget operations."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.child_monthly_budget import ChildMonthlyBudget
from app.schemas.child_monthly_budget import ChildMonthlyBudgetCreate


class ChildMonthlyBudgetService:
    """Service for managing child monthly budgets."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def set_budget(self, data: ChildMonthlyBudgetCreate) -> ChildMonthlyBudget:
        """Set or update a monthly budget for a child user."""
        # Check if budget already exists
        result = await self.db.execute(
            select(ChildMonthlyBudget).where(
                ChildMonthlyBudget.user_id == data.user_id,
                ChildMonthlyBudget.year == data.year,
                ChildMonthlyBudget.month == data.month,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing budget (preserve carryover if not specified)
            update_data = data.model_dump()
            if update_data.get("carryover_amount") is None:
                update_data["carryover_amount"] = existing.carryover_amount

            for field, value in update_data.items():
                setattr(existing, field, value)

            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            # Create new budget
            budget = ChildMonthlyBudget(**data.model_dump())
            self.db.add(budget)
            await self.db.commit()
            await self.db.refresh(budget)
            return budget

    async def get_budget(self, user_id: int, year: int, month: int) -> ChildMonthlyBudget | None:
        """Get monthly budget for a specific user and month."""
        result = await self.db.execute(
            select(ChildMonthlyBudget).where(
                ChildMonthlyBudget.user_id == user_id,
                ChildMonthlyBudget.year == year,
                ChildMonthlyBudget.month == month,
            )
        )
        return result.scalar_one_or_none()

    async def get_user_budgets(self, user_id: int) -> list[ChildMonthlyBudget]:
        """Get all budgets for a user."""
        result = await self.db.execute(
            select(ChildMonthlyBudget)
            .where(ChildMonthlyBudget.user_id == user_id)
            .order_by(ChildMonthlyBudget.year.desc(), ChildMonthlyBudget.month.desc())
        )
        return list(result.scalars().all())

    async def delete_budget(self, user_id: int, year: int, month: int) -> bool:
        """Delete a monthly budget."""
        budget = await self.get_budget(user_id, year, month)
        if not budget:
            return False

        await self.db.delete(budget)
        await self.db.commit()
        return True

    async def apply_carryover(
        self,
        user_id: int,
        from_year: int,  # Used for documentation/validation
        from_month: int,  # Used for documentation/validation
        to_year: int,
        to_month: int,
        amount: Decimal,
    ) -> bool:
        """Apply carryover from one month to another."""

        # Validate that we are carrying over from a valid source month
        # This ensures the carryover amount comes from a legitimate source
        source_exists = await self.get_budget(user_id, from_year, from_month)
        if not source_exists:
            raise ValueError(f"Source budget for {from_year}-{from_month:02d} does not exist")
        # Get target budget (to which we carry over)
        target_budget = await self.get_budget(user_id, to_year, to_month)

        if not target_budget:
            # If target budget doesn't exist, we can't apply carryover
            return False

        # Apply carryover to target budget
        target_budget.carryover_amount = amount

        await self.db.commit()
        await self.db.refresh(target_budget)
        return True

    async def calculate_carryover(self, user_id: int, year: int, month: int) -> Decimal:
        """Calculate the carryover amount from a specific month."""
        # Get the budget for the specified month
        budget = await self.get_budget(user_id, year, month)

        if not budget:
            return Decimal("0.00")

        # Calculate total spent in that month
        from sqlalchemy import func, select

        from app.models.child_expense import ChildExpense

        query = select(func.sum(ChildExpense.amount)).where(
            ChildExpense.user_id == user_id,
            ChildExpense.budget_id == budget.id,
        )
        result = await self.db.execute(query)
        total_spent = result.scalar_one() or Decimal("0.00")

        # Calculate remaining budget (base + carryover - spent)
        total_available = budget.budget_amount + budget.carryover_amount
        remaining = total_available - total_spent

        # Return positive remaining as carryover (if any)
        return remaining if remaining > 0 else Decimal("0.00")
