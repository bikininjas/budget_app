"""Expense service for expense management."""

from datetime import date
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.expense import Expense, SplitType
from app.schemas.expense import ExpenseCreate, ExpenseFilter, ExpenseUpdate


class ExpenseService:
    """Service class for expense operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, expense_id: int) -> Expense | None:
        """Get expense by ID with related data."""
        result = await self.db.execute(
            select(Expense)
            .options(
                joinedload(Expense.category),
                joinedload(Expense.account),
                joinedload(Expense.assigned_user),
                joinedload(Expense.project),
            )
            .where(Expense.id == expense_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: ExpenseFilter | None = None,
    ) -> list[Expense]:
        """Get all expenses with pagination and filtering."""
        query = (
            select(Expense)
            .options(
                joinedload(Expense.category),
                joinedload(Expense.account),
                joinedload(Expense.assigned_user),
                joinedload(Expense.project),
            )
            .where(Expense.is_active)
        )

        if filters:
            conditions = []
            if filters.category_id:
                conditions.append(Expense.category_id == filters.category_id)
            if filters.account_id:
                conditions.append(Expense.account_id == filters.account_id)
            if filters.assigned_to:
                conditions.append(Expense.assigned_to == filters.assigned_to)
            if filters.project_id:
                conditions.append(Expense.project_id == filters.project_id)
            if filters.frequency:
                conditions.append(Expense.frequency == filters.frequency)
            if filters.split_type:
                conditions.append(Expense.split_type == filters.split_type)
            if filters.is_recurring is not None:
                conditions.append(Expense.is_recurring == filters.is_recurring)
            if filters.start_date:
                conditions.append(Expense.date >= filters.start_date)
            if filters.end_date:
                conditions.append(Expense.date <= filters.end_date)
            if filters.min_amount:
                conditions.append(Expense.amount >= filters.min_amount)
            if filters.max_amount:
                conditions.append(Expense.amount <= filters.max_amount)

            if conditions:
                query = query.where(and_(*conditions))

        query = query.order_by(Expense.date.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def create(self, expense_data: ExpenseCreate, created_by: int) -> Expense:
        """Create a new expense."""
        expense = Expense(
            **expense_data.model_dump(),
            created_by=created_by,
        )
        self.db.add(expense)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def update(self, expense_id: int, expense_data: ExpenseUpdate) -> Expense | None:
        """Update an existing expense."""
        expense = await self.get_by_id(expense_id)
        if not expense:
            return None

        update_data = expense_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(expense, field, value)

        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense_id: int) -> bool:
        """Soft delete an expense."""
        expense = await self.get_by_id(expense_id)
        if not expense:
            return False
        expense.is_active = False
        await self.db.flush()
        return True

    async def get_total_by_category(
        self, start_date: date | None = None, end_date: date | None = None
    ) -> list[dict]:
        """Get total expenses grouped by category."""
        query = (
            select(
                Expense.category_id,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .where(Expense.is_active)
            .group_by(Expense.category_id)
        )

        if start_date:
            query = query.where(Expense.date >= start_date)
        if end_date:
            query = query.where(Expense.date <= end_date)

        result = await self.db.execute(query)
        return [
            {"category_id": row.category_id, "total": row.total, "count": row.count}
            for row in result.all()
        ]

    async def get_monthly_totals(self, year: int) -> list[dict]:
        """Get monthly expense totals for a year."""
        query = (
            select(
                func.extract("month", Expense.date).label("month"),
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .where(Expense.is_active)
            .where(func.extract("year", Expense.date) == year)
            .group_by(func.extract("month", Expense.date))
            .order_by(func.extract("month", Expense.date))
        )

        result = await self.db.execute(query)
        return [
            {"month": int(row.month), "total": row.total, "count": row.count}
            for row in result.all()
        ]

    async def calculate_user_balance(
        self,
        user1_id: int,
        user2_id: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict:
        """Calculate balance between two users based on split types."""
        query = select(Expense).where(
            Expense.is_active,
            Expense.assigned_to.in_([user1_id, user2_id]),
        )

        if start_date:
            query = query.where(Expense.date >= start_date)
        if end_date:
            query = query.where(Expense.date <= end_date)

        result = await self.db.execute(query)
        expenses = result.scalars().all()

        user1_paid = Decimal("0")
        user1_should_pay = Decimal("0")
        user2_paid = Decimal("0")
        user2_should_pay = Decimal("0")

        for expense in expenses:
            amount = expense.amount

            # Track who paid
            if expense.assigned_to == user1_id:
                user1_paid += amount
            else:
                user2_paid += amount

            # Calculate who should pay based on split type
            if expense.split_type == SplitType.EQUAL:
                user1_should_pay += amount / 2
                user2_should_pay += amount / 2
            elif expense.split_type == SplitType.ONE_THIRD_TWO_THIRDS:
                user1_should_pay += amount / 3
                user2_should_pay += amount * 2 / 3
            elif expense.split_type == SplitType.TWO_THIRDS_ONE_THIRD:
                user1_should_pay += amount * 2 / 3
                user2_should_pay += amount / 3
            elif expense.split_type == SplitType.FULL_SEB:
                user1_should_pay += amount
            elif expense.split_type == SplitType.FULL_MARIE:
                user2_should_pay += amount

        return {
            "user1_paid": user1_paid,
            "user1_should_pay": user1_should_pay,
            "user1_balance": user1_should_pay - user1_paid,
            "user2_paid": user2_paid,
            "user2_should_pay": user2_should_pay,
            "user2_balance": user2_should_pay - user2_paid,
        }

    async def get_monthly_history(self) -> list[dict]:
        """Get expenses grouped by month with details."""
        from app.models.category import Category

        query = (
            select(
                func.extract("year", Expense.date).label("year"),
                func.extract("month", Expense.date).label("month"),
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .where(Expense.is_active)
            .group_by(
                func.extract("year", Expense.date),
                func.extract("month", Expense.date),
            )
            .order_by(
                func.extract("year", Expense.date).desc(),
                func.extract("month", Expense.date).desc(),
            )
        )

        result = await self.db.execute(query)
        months_data = result.all()

        history = []
        for row in months_data:
            year = int(row.year)
            month = int(row.month)

            # Get expenses for this month
            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1)
            else:
                month_end = date(year, month + 1, 1)

            expenses_query = (
                select(Expense)
                .options(joinedload(Expense.category))
                .where(
                    Expense.is_active,
                    Expense.date >= month_start,
                    Expense.date < month_end,
                )
                .order_by(Expense.date.desc())
            )
            expenses_result = await self.db.execute(expenses_query)
            expenses = list(expenses_result.scalars().unique().all())

            # Category breakdown for this month
            category_query = (
                select(
                    Category.name,
                    Category.color,
                    Category.icon,
                    func.sum(Expense.amount).label("total"),
                    func.count(Expense.id).label("count"),
                )
                .join(Category, Expense.category_id == Category.id)
                .where(
                    Expense.is_active,
                    Expense.date >= month_start,
                    Expense.date < month_end,
                )
                .group_by(Category.id, Category.name, Category.color, Category.icon)
                .order_by(func.sum(Expense.amount).desc())
            )
            category_result = await self.db.execute(category_query)
            categories = [
                {
                    "name": cat.name,
                    "color": cat.color,
                    "icon": cat.icon,
                    "total": float(cat.total),
                    "count": cat.count,
                }
                for cat in category_result.all()
            ]

            history.append({
                "year": year,
                "month": month,
                "total": float(row.total),
                "count": row.count,
                "categories": categories,
                "expenses": [
                    {
                        "id": exp.id,
                        "label": exp.label,
                        "amount": float(exp.amount),
                        "date": exp.date.isoformat(),
                        "category_name": exp.category.name if exp.category else None,
                        "category_color": exp.category.color if exp.category else None,
                        "category_icon": exp.category.icon if exp.category else None,
                        "is_recurring": exp.is_recurring,
                    }
                    for exp in expenses
                ],
            })

        return history
