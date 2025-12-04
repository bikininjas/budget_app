"""Expense schemas."""

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.expense import Frequency, SplitType


class ExpenseBase(BaseModel):
    """Base expense schema."""

    label: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    amount: Decimal = Field(..., gt=0)
    date: date_type
    frequency: Frequency = Frequency.one_time
    split_type: SplitType = SplitType.fifty_fifty


class ExpenseCreate(ExpenseBase):
    """Schema for creating a new expense."""

    category_id: int
    account_id: int
    assigned_to: int
    project_id: int | None = None


class ExpenseUpdate(BaseModel):
    """Schema for updating an expense."""

    label: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    amount: Decimal | None = Field(None, gt=0)
    date: date_type | None = None
    frequency: Frequency | None = None
    split_type: SplitType | None = None
    category_id: int | None = None
    account_id: int | None = None
    assigned_to: int | None = None
    project_id: int | None = None
    is_active: bool | None = None


class ExpenseResponse(ExpenseBase):
    """Schema for expense response."""

    id: int
    category_id: int
    account_id: int
    assigned_to: int
    created_by: int
    project_id: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Nested data
    category_name: str | None = None
    account_name: str | None = None
    assigned_user_name: str | None = None

    model_config = {"from_attributes": True}


class ExpenseFilter(BaseModel):
    """Schema for filtering expenses."""

    category_id: int | None = None
    account_id: int | None = None
    assigned_to: int | None = None
    project_id: int | None = None
    frequency: Frequency | None = None
    split_type: SplitType | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
