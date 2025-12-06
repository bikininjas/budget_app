"""API routes for child expense operations."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.child_expense import (
    ChildExpenseCreate,
    ChildExpenseResponse,
    ChildExpenseSummary,
    ChildExpenseUpdate,
)
from app.services.child_expense import ChildExpenseService

router = APIRouter(prefix="/child-expenses", tags=["child-expenses"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def check_access(current_user: User, target_user_id: int) -> None:
    """
    Check if current user can access child expenses.

    - Child users can only access their own expenses
    - Admin and regular users (parents) can access all expenses
    """
    if current_user.role == UserRole.child and current_user.id != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own expenses",
        )


@router.post("/", response_model=ChildExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    db: DbSession,
    current_user: CurrentUser,
    data: ChildExpenseCreate,
) -> ChildExpenseResponse:
    """Create a new child expense. Parents can create for any child, children can create for themselves."""
    check_access(current_user, data.user_id)

    service = ChildExpenseService(db)
    expense = await service.create(data)
    return ChildExpenseResponse.model_validate(expense)


@router.get("/", response_model=list[ChildExpenseResponse])
async def get_expenses(
    db: DbSession,
    current_user: CurrentUser,
    user_id: int | None = Query(None, description="Filter by user ID"),
    month: int | None = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: int | None = Query(None, ge=2000, description="Filter by year"),
) -> list[ChildExpenseResponse]:
    """Get child expenses. Parents see all, children see only their own."""
    service = ChildExpenseService(db)

    # If user_id specified, check access
    if user_id:
        check_access(current_user, user_id)
        expenses = await service.get_by_user(user_id, month, year)
    else:
        # Child users can only see their own
        if current_user.role == UserRole.child:
            expenses = await service.get_by_user(current_user.id, month, year)
        else:
            expenses = await service.get_all()

    return [ChildExpenseResponse.model_validate(e) for e in expenses]


@router.get("/summary", response_model=ChildExpenseSummary)
async def get_summary(
    db: DbSession,
    current_user: CurrentUser,
    user_id: int | None = Query(None, description="User ID (defaults to current user)"),
    month: int | None = Query(None, ge=1, le=12, description="Month (defaults to current)"),
    year: int | None = Query(None, ge=2000, description="Year (defaults to current)"),
) -> ChildExpenseSummary:
    """Get expense summary with budget tracking."""
    target_user_id = user_id or current_user.id
    check_access(current_user, target_user_id)

    service = ChildExpenseService(db)
    return await service.get_summary(target_user_id, month, year)


@router.get("/{expense_id}", response_model=ChildExpenseResponse)
async def get_expense(
    db: DbSession,
    current_user: CurrentUser,
    expense_id: int,
) -> ChildExpenseResponse:
    """Get a specific child expense by ID."""
    service = ChildExpenseService(db)
    expense = await service.get_by_id(expense_id)

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    check_access(current_user, expense.user_id)
    return ChildExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ChildExpenseResponse)
async def update_expense(
    db: DbSession,
    current_user: CurrentUser,
    expense_id: int,
    data: ChildExpenseUpdate,
) -> ChildExpenseResponse:
    """Update a child expense. Parents can update any, children can update their own."""
    service = ChildExpenseService(db)
    expense = await service.get_by_id(expense_id)

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    check_access(current_user, expense.user_id)

    updated = await service.update(expense_id, data)
    return ChildExpenseResponse.model_validate(updated)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    db: DbSession,
    current_user: CurrentUser,
    expense_id: int,
) -> None:
    """Delete a child expense. Parents can delete any, children can delete their own."""
    service = ChildExpenseService(db)
    expense = await service.get_by_id(expense_id)

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    check_access(current_user, expense.user_id)

    success = await service.delete(expense_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete expense",
        )
