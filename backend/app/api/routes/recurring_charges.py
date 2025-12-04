"""Routes for recurring charges (budget planning)."""

from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.schemas.recurring_charge import (
    RecurringChargeCreate,
    RecurringChargeResponse,
    RecurringChargeUpdate,
)
from app.services.recurring_charge import RecurringChargeService

router = APIRouter(prefix="/recurring-charges", tags=["Recurring Charges"])


class BudgetCategoryItem(BaseModel):
    """Category budget item."""

    category: str
    total: Decimal


class BudgetSummaryResponse(BaseModel):
    """Budget summary response."""

    total_monthly: Decimal
    total_annual: Decimal
    charges: list[RecurringChargeResponse]
    by_category: list[BudgetCategoryItem]


def _build_charge_response(
    charge, monthly_amount: Decimal | None = None
) -> RecurringChargeResponse:
    """Build response from charge model."""
    if monthly_amount is None:
        monthly_amount = RecurringChargeService.calculate_monthly_amount(
            charge.amount, charge.frequency
        )

    return RecurringChargeResponse(
        id=charge.id,
        name=charge.name,
        description=charge.description,
        amount=charge.amount,
        frequency=charge.frequency,
        category_id=charge.category_id,
        is_active=charge.is_active,
        created_at=charge.created_at,
        updated_at=charge.updated_at,
        category_name=charge.category.name if charge.category else None,
        category_color=charge.category.color if charge.category else None,
        category_icon=charge.category.icon if charge.category else None,
        monthly_amount=monthly_amount,
    )


@router.get("/", response_model=list[RecurringChargeResponse])
async def list_recurring_charges(
    db: DbSession,
    _current_user: CurrentUser,
    include_inactive: bool = False,
) -> list[RecurringChargeResponse]:
    """Get all recurring charges."""
    service = RecurringChargeService(db)
    charges = await service.get_all(include_inactive=include_inactive)
    return [_build_charge_response(charge) for charge in charges]


@router.get("/summary", response_model=BudgetSummaryResponse)
async def get_budget_summary(
    db: DbSession,
    _current_user: CurrentUser,
) -> BudgetSummaryResponse:
    """Get the complete budget summary with all recurring charges."""
    service = RecurringChargeService(db)
    summary = await service.get_budget_summary()

    charges_response = [
        _build_charge_response(item["charge"], item["monthly_amount"])
        for item in summary["charges"]
    ]

    return BudgetSummaryResponse(
        total_monthly=summary["total_monthly"],
        total_annual=summary["total_annual"],
        charges=charges_response,
        by_category=summary["by_category"],
    )


@router.post("/", response_model=RecurringChargeResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_charge(
    data: RecurringChargeCreate,
    db: DbSession,
    _current_user: CurrentUser,
) -> RecurringChargeResponse:
    """Create a new recurring charge."""
    service = RecurringChargeService(db)
    charge = await service.create(data)

    # Reload with relationships
    charge = await service.get_by_id(charge.id)
    return _build_charge_response(charge)


@router.get("/{charge_id}", response_model=RecurringChargeResponse)
async def get_recurring_charge(
    charge_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> RecurringChargeResponse:
    """Get a specific recurring charge."""
    service = RecurringChargeService(db)
    charge = await service.get_by_id(charge_id)
    if not charge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring charge not found",
        )
    return _build_charge_response(charge)


@router.patch("/{charge_id}", response_model=RecurringChargeResponse)
async def update_recurring_charge(
    charge_id: int,
    data: RecurringChargeUpdate,
    db: DbSession,
    _current_user: CurrentUser,
) -> RecurringChargeResponse:
    """Update a recurring charge."""
    service = RecurringChargeService(db)
    charge = await service.update(charge_id, data)
    if not charge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring charge not found",
        )
    return _build_charge_response(charge)


@router.delete("/{charge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_charge(
    charge_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> None:
    """Delete a recurring charge."""
    service = RecurringChargeService(db)
    deleted = await service.delete(charge_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring charge not found",
        )
