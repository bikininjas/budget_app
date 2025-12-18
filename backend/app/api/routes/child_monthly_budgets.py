"""API routes for child monthly budget operations."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.child_monthly_budget import (
    ChildMonthlyBudgetCreate,
    ChildMonthlyBudgetResponse,
    ChildMonthlyBudgetUpdate,
)
from app.services.child_monthly_budget import ChildMonthlyBudgetService

router = APIRouter(prefix="/child-budgets", tags=["child-budgets"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def check_admin_access(current_user: User) -> None:
    """Check if current user is admin."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage child budgets",
        )


@router.post("/", response_model=ChildMonthlyBudgetResponse, status_code=status.HTTP_201_CREATED)
async def set_monthly_budget(
    db: DbSession,
    current_user: CurrentUser,
    data: ChildMonthlyBudgetCreate,
) -> ChildMonthlyBudgetResponse:
    """Set or update a monthly budget for a child user. Admin only."""
    check_admin_access(current_user)

    service = ChildMonthlyBudgetService(db)
    budget = await service.set_budget(data)
    return ChildMonthlyBudgetResponse.model_validate(budget)


@router.get("", response_model=list[ChildMonthlyBudgetResponse])
async def get_user_budgets(
    db: DbSession,
    current_user: CurrentUser,
    user_id: int = Query(..., description="Child user ID"),
) -> list[ChildMonthlyBudgetResponse]:
    """Get all monthly budgets for a child user. Admin only."""
    check_admin_access(current_user)

    service = ChildMonthlyBudgetService(db)
    budgets = await service.get_user_budgets(user_id)
    return [ChildMonthlyBudgetResponse.model_validate(b) for b in budgets]


@router.get("/{year}/{month}", response_model=ChildMonthlyBudgetResponse | None)
async def get_monthly_budget(
    db: DbSession,
    current_user: CurrentUser,
    year: int,
    month: int,
    user_id: int = Query(..., description="Child user ID"),
) -> ChildMonthlyBudgetResponse | None:
    """Get a specific monthly budget. Admin only."""
    check_admin_access(current_user)

    service = ChildMonthlyBudgetService(db)
    budget = await service.get_budget(user_id, year, month)

    if budget:
        return ChildMonthlyBudgetResponse.model_validate(budget)
    return None


@router.put("/{year}/{month}", response_model=ChildMonthlyBudgetResponse)
async def update_monthly_budget(
    db: DbSession,
    current_user: CurrentUser,
    year: int,
    month: int,
    data: ChildMonthlyBudgetUpdate,
    user_id: int = Query(..., description="Child user ID"),
) -> ChildMonthlyBudgetResponse:
    """Update a monthly budget. Admin only."""
    check_admin_access(current_user)

    service = ChildMonthlyBudgetService(db)
    budget = await service.get_budget(user_id, year, month)

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    # Perform update by creating/setting the budget
    create_data = ChildMonthlyBudgetCreate(
        user_id=user_id,
        year=year,
        month=month,
        budget_amount=data.budget_amount,
    )
    updated = await service.set_budget(create_data)
    return ChildMonthlyBudgetResponse.model_validate(updated)


@router.delete("/{year}/{month}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_monthly_budget(
    db: DbSession,
    current_user: CurrentUser,
    year: int,
    month: int,
    user_id: int = Query(..., description="Child user ID"),
) -> None:
    """Delete a monthly budget. Admin only."""
    check_admin_access(current_user)

    service = ChildMonthlyBudgetService(db)
    success = await service.delete_budget(user_id, year, month)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
