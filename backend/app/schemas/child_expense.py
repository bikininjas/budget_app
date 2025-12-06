"""Pydantic schemas for child expense operations."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ChildExpenseBase(BaseModel):
    """Base schema for child expense."""

    description: str = Field(..., min_length=1, max_length=500, description="Description of the purchase")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Purchase amount")
    purchase_date: date = Field(default_factory=date.today, description="Date of purchase")
    product_url: HttpUrl | str | None = Field(None, description="URL of the product if bought online")
    notes: str | None = Field(None, max_length=1000, description="Additional notes")


class ChildExpenseCreate(ChildExpenseBase):
    """Schema for creating a child expense."""

    user_id: int = Field(..., description="ID of the child user")


class ChildExpenseUpdate(BaseModel):
    """Schema for updating a child expense."""

    description: str | None = Field(None, min_length=1, max_length=500)
    amount: Decimal | None = Field(None, gt=0, decimal_places=2)
    purchase_date: date | None = None
    product_url: HttpUrl | str | None = None
    notes: str | None = Field(None, max_length=1000)


class ChildExpenseResponse(ChildExpenseBase):
    """Schema for child expense response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class ChildExpenseSummary(BaseModel):
    """Summary of child expenses for budget tracking."""

    user_id: int
    username: str
    monthly_budget: Decimal | None
    total_spent: Decimal
    remaining_budget: Decimal | None
    expense_count: int
    current_month: str  # Format: "YYYY-MM"
