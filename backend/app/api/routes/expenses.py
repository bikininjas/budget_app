"""Expense management routes."""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.models.expense import Expense, Frequency, SplitType
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseFilter,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.services.expense import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _build_expense_response(expense: Expense) -> ExpenseResponse:
    """Build an ExpenseResponse from an Expense model."""
    return ExpenseResponse(
        id=expense.id,
        label=expense.label,
        description=expense.description,
        amount=expense.amount,
        date=expense.date,
        frequency=expense.frequency,
        split_type=expense.split_type,
        is_recurring=expense.is_recurring,
        category_id=expense.category_id,
        account_id=expense.account_id,
        assigned_to=expense.assigned_to,
        created_by=expense.created_by,
        project_id=expense.project_id,
        is_active=expense.is_active,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        category_name=expense.category.name if expense.category else None,
        category_color=expense.category.color if expense.category else None,
        account_name=expense.account.name if expense.account else None,
        assigned_user_name=expense.assigned_user.full_name if expense.assigned_user else None,
        project_name=expense.project.name if expense.project else None,
    )


class RecurringBudgetItem(BaseModel):
    """A single recurring expense item."""

    id: int
    label: str
    description: str | None
    amount: Decimal
    frequency: Frequency
    category_name: str | None
    category_color: str | None
    monthly_amount: Decimal  # Amount normalized to monthly


class RecurringBudgetResponse(BaseModel):
    """Response for recurring budget summary."""

    total_monthly: Decimal
    items: list[RecurringBudgetItem]
    by_category: list[dict]


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    db: DbSession,
    _current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    category_id: int | None = None,
    account_id: int | None = None,
    assigned_to: int | None = None,
    project_id: int | None = None,
    frequency: Frequency | None = None,
    split_type: SplitType | None = None,
    is_recurring: bool | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
) -> list[ExpenseResponse]:
    """Get all expenses with optional filtering."""
    expense_service = ExpenseService(db)

    filters = ExpenseFilter(
        category_id=category_id,
        account_id=account_id,
        assigned_to=assigned_to,
        project_id=project_id,
        frequency=frequency,
        split_type=split_type,
        is_recurring=is_recurring,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
    )

    expenses = await expense_service.get_all(skip=skip, limit=limit, filters=filters)

    return [_build_expense_response(exp) for exp in expenses]


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> ExpenseResponse:
    """Create a new expense."""
    expense_service = ExpenseService(db)
    expense = await expense_service.create(expense_data, created_by=current_user.id)

    # Reload with relationships
    expense = await expense_service.get_by_id(expense.id)
    return _build_expense_response(expense)


@router.get("/recurring/budget", response_model=RecurringBudgetResponse)
async def get_recurring_budget(
    db: DbSession,
    _current_user: CurrentUser,
) -> RecurringBudgetResponse:
    """Get the monthly recurring budget summary."""
    expense_service = ExpenseService(db)

    # Get all recurring expenses
    filters = ExpenseFilter(is_recurring=True)
    recurring_expenses = await expense_service.get_all(filters=filters, limit=1000)

    items = []
    total_monthly = Decimal("0")
    category_totals: dict[str, Decimal] = {}

    for exp in recurring_expenses:
        # Normalize to monthly amount
        monthly_amount = Decimal(str(exp.amount))
        if exp.frequency == Frequency.quarterly:
            monthly_amount = monthly_amount / 3
        elif exp.frequency == Frequency.annual:
            monthly_amount = monthly_amount / 12

        total_monthly += monthly_amount

        category_name = exp.category.name if exp.category else "Sans catégorie"
        category_color = exp.category.color if exp.category else "#6B7280"

        # Track by category
        if category_name not in category_totals:
            category_totals[category_name] = Decimal("0")
        category_totals[category_name] += monthly_amount

        items.append(
            RecurringBudgetItem(
                id=exp.id,
                label=exp.label,
                description=exp.description,
                amount=exp.amount,
                frequency=exp.frequency,
                category_name=category_name,
                category_color=category_color,
                monthly_amount=round(monthly_amount, 2),
            )
        )

    # Build category breakdown
    by_category = [
        {"category": cat, "total": round(amount, 2)}
        for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    return RecurringBudgetResponse(
        total_monthly=round(total_monthly, 2),
        items=items,
        by_category=by_category,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> ExpenseResponse:
    """Get a specific expense by ID."""
    expense_service = ExpenseService(db)
    expense = await expense_service.get_by_id(expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )
    return _build_expense_response(expense)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    db: DbSession,
    _current_user: CurrentUser,
) -> ExpenseResponse:
    """Update an expense."""
    expense_service = ExpenseService(db)
    expense = await expense_service.update(expense_id, expense_data)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    # Reload with relationships
    expense = await expense_service.get_by_id(expense.id)
    return _build_expense_response(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> None:
    """Delete an expense."""
    expense_service = ExpenseService(db)
    success = await expense_service.delete(expense_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )


@router.get("/stats/by-category", response_model=list[dict])
async def get_expenses_by_category(
    db: DbSession,
    _current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> list[dict]:
    """Get expense totals grouped by category."""
    expense_service = ExpenseService(db)
    return await expense_service.get_total_by_category(start_date, end_date)


@router.get("/stats/monthly/{year}", response_model=list[dict])
async def get_monthly_expenses(
    year: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> list[dict]:
    """Get monthly expense totals for a specific year."""
    expense_service = ExpenseService(db)
    return await expense_service.get_monthly_totals(year)


@router.get("/stats/balance", response_model=dict)
async def get_user_balance(
    user1_id: int,
    user2_id: int,
    db: DbSession,
    _current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> dict:
    """Calculate balance between two users."""
    expense_service = ExpenseService(db)
    return await expense_service.calculate_user_balance(user1_id, user2_id, start_date, end_date)


@router.get("/stats/history", response_model=list[dict])
async def get_monthly_history(
    db: DbSession,
    _current_user: CurrentUser,
) -> list[dict]:
    """Get expenses grouped by month with category breakdown."""
    expense_service = ExpenseService(db)
    return await expense_service.get_monthly_history()
