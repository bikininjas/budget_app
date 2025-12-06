"""Service for recurring charges management."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.recurring_charge import ChargeFrequency, RecurringCharge
from app.schemas.recurring_charge import RecurringChargeCreate, RecurringChargeUpdate


class RecurringChargeService:
    """Service for managing recurring charges."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, include_inactive: bool = False) -> list[RecurringCharge]:
        """Get all recurring charges."""
        query = select(RecurringCharge).options(selectinload(RecurringCharge.category))

        if not include_inactive:
            query = query.where(RecurringCharge.is_active == True)  # noqa: E712

        query = query.order_by(RecurringCharge.name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, charge_id: int) -> RecurringCharge | None:
        """Get a recurring charge by ID."""
        query = (
            select(RecurringCharge)
            .options(selectinload(RecurringCharge.category))
            .where(RecurringCharge.id == charge_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, data: RecurringChargeCreate) -> RecurringCharge:
        """Create a new recurring charge."""
        charge = RecurringCharge(**data.model_dump())
        self.db.add(charge)
        await self.db.commit()
        await self.db.refresh(charge)
        return charge

    async def update(self, charge_id: int, data: RecurringChargeUpdate) -> RecurringCharge | None:
        """Update a recurring charge."""
        charge = await self.get_by_id(charge_id)
        if not charge:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(charge, field, value)

        await self.db.commit()
        await self.db.refresh(charge)
        return charge

    async def delete(self, charge_id: int) -> bool:
        """Delete a recurring charge."""
        charge = await self.get_by_id(charge_id)
        if not charge:
            return False

        await self.db.delete(charge)
        await self.db.commit()
        return True

    @staticmethod
    def calculate_monthly_amount(amount: Decimal, frequency: ChargeFrequency) -> Decimal:
        """Calculate monthly amount from any frequency."""
        if frequency == ChargeFrequency.monthly:
            return amount
        elif frequency == ChargeFrequency.quarterly:
            return amount / 3
        elif frequency == ChargeFrequency.annual:
            return amount / 12
        return amount

    async def get_budget_summary(self) -> dict:
        """Get a summary of the recurring budget."""
        charges = await self.get_all()

        total_monthly = Decimal("0")
        category_totals: dict[str, Decimal] = {}
        charges_with_monthly: list[dict] = []

        for charge in charges:
            monthly_amount = self.calculate_monthly_amount(charge.amount, charge.frequency)
            total_monthly += monthly_amount

            category_name = charge.category.name if charge.category else "Sans catégorie"
            if category_name not in category_totals:
                category_totals[category_name] = Decimal("0")
            category_totals[category_name] += monthly_amount

            charges_with_monthly.append(
                {
                    "charge": charge,
                    "monthly_amount": round(monthly_amount, 2),
                }
            )

        by_category = [
            {"category": cat, "total": round(amount, 2)}
            for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "total_monthly": round(total_monthly, 2),
            "total_annual": round(total_monthly * 12, 2),
            "charges": charges_with_monthly,
            "by_category": by_category,
        }
