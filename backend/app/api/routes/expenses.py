"""Expense management routes."""

from datetime import date

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.expense import Frequency, SplitType
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseFilter,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.services.expense import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/", response_model=list[ExpenseResponse])
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
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
    )

    expenses = await expense_service.get_all(skip=skip, limit=limit, filters=filters)

    return [
        ExpenseResponse(
            id=exp.id,
            label=exp.label,
            description=exp.description,
            amount=exp.amount,
            date=exp.date,
            frequency=exp.frequency,
            split_type=exp.split_type,
            category_id=exp.category_id,
            account_id=exp.account_id,
            assigned_to=exp.assigned_to,
            created_by=exp.created_by,
            project_id=exp.project_id,
            is_active=exp.is_active,
            created_at=exp.created_at,
            updated_at=exp.updated_at,
            category_name=exp.category.name if exp.category else None,
            account_name=exp.account.name if exp.account else None,
            assigned_user_name=exp.assigned_user.full_name if exp.assigned_user else None,
        )
        for exp in expenses
    ]


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

    return ExpenseResponse(
        id=expense.id,
        label=expense.label,
        description=expense.description,
        amount=expense.amount,
        date=expense.date,
        frequency=expense.frequency,
        split_type=expense.split_type,
        category_id=expense.category_id,
        account_id=expense.account_id,
        assigned_to=expense.assigned_to,
        created_by=expense.created_by,
        project_id=expense.project_id,
        is_active=expense.is_active,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        category_name=expense.category.name if expense.category else None,
        account_name=expense.account.name if expense.account else None,
        assigned_user_name=expense.assigned_user.full_name if expense.assigned_user else None,
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

    return ExpenseResponse(
        id=expense.id,
        label=expense.label,
        description=expense.description,
        amount=expense.amount,
        date=expense.date,
        frequency=expense.frequency,
        split_type=expense.split_type,
        category_id=expense.category_id,
        account_id=expense.account_id,
        assigned_to=expense.assigned_to,
        created_by=expense.created_by,
        project_id=expense.project_id,
        is_active=expense.is_active,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        category_name=expense.category.name if expense.category else None,
        account_name=expense.account.name if expense.account else None,
        assigned_user_name=expense.assigned_user.full_name if expense.assigned_user else None,
    )


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

    return ExpenseResponse(
        id=expense.id,
        label=expense.label,
        description=expense.description,
        amount=expense.amount,
        date=expense.date,
        frequency=expense.frequency,
        split_type=expense.split_type,
        category_id=expense.category_id,
        account_id=expense.account_id,
        assigned_to=expense.assigned_to,
        created_by=expense.created_by,
        project_id=expense.project_id,
        is_active=expense.is_active,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        category_name=expense.category.name if expense.category else None,
        account_name=expense.account.name if expense.account else None,
        assigned_user_name=expense.assigned_user.full_name if expense.assigned_user else None,
    )


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
