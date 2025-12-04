"""Pydantic schemas for recurring charges."""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ChargeFrequency(str, Enum):
    """Frequency of recurring charges."""

    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class RecurringChargeBase(BaseModel):
    """Base schema for recurring charges."""

    name: str
    description: str | None = None
    amount: Decimal
    frequency: ChargeFrequency = ChargeFrequency.monthly
    category_id: int


class RecurringChargeCreate(RecurringChargeBase):
    """Schema for creating a recurring charge."""

    pass


class RecurringChargeUpdate(BaseModel):
    """Schema for updating a recurring charge."""

    name: str | None = None
    description: str | None = None
    amount: Decimal | None = None
    frequency: ChargeFrequency | None = None
    category_id: int | None = None
    is_active: bool | None = None


class RecurringChargeResponse(RecurringChargeBase):
    """Schema for recurring charge response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None
    monthly_amount: Decimal | None = None  # Amount normalized to monthly


class RecurringBudgetSummary(BaseModel):
    """Summary of all recurring charges."""

    total_monthly: Decimal
    total_annual: Decimal
    charges: list[RecurringChargeResponse]
    by_category: list[dict]
