"""Pydantic schemas for child monthly budget operations."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ChildMonthlyBudgetBase(BaseModel):
    """Base schema for child monthly budget."""

    user_id: int = Field(..., description="ID of the child user")
    year: int = Field(..., ge=2000, description="Year (e.g., 2025)")
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    budget_amount: Decimal = Field(..., gt=0, decimal_places=2, description="Monthly budget amount")
    carryover_amount: Decimal = Field(
        default=0.00, ge=0, decimal_places=2, description="Amount carried over from previous month"
    )
    is_exceptional: bool = Field(
        default=False, description="Whether this is an exceptional budget (different from standard)"
    )
    notes: str | None = Field(
        None, max_length=500, description="Additional notes about this budget"
    )


class ChildMonthlyBudgetCreate(ChildMonthlyBudgetBase):
    """Schema for creating a monthly budget."""

    pass


class ChildMonthlyBudgetUpdate(BaseModel):
    """Schema for updating a monthly budget."""

    budget_amount: Decimal = Field(..., gt=0, decimal_places=2, description="Monthly budget amount")
    carryover_amount: Decimal | None = Field(
        None, ge=0, decimal_places=2, description="Amount carried over from previous month"
    )
    is_exceptional: bool | None = Field(None, description="Whether this is an exceptional budget")
    notes: str | None = Field(
        None, max_length=500, description="Additional notes about this budget"
    )


class ChildMonthlyBudgetResponse(ChildMonthlyBudgetBase):
    """Schema for monthly budget response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
