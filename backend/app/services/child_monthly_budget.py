"""Service layer for child monthly budget operations."""

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
            # Update existing budget
            existing.budget_amount = data.budget_amount
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
