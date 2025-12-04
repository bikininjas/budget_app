"""Account schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.account import AccountType


class AccountBase(BaseModel):
    """Base account schema."""

    name: str = Field(..., min_length=1, max_length=255)
    account_type: AccountType
    description: str | None = None


class AccountCreate(AccountBase):
    """Schema for creating a new account."""

    balance: Decimal = Decimal("0.00")


class AccountUpdate(BaseModel):
    """Schema for updating an account."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    balance: Decimal | None = None
    is_active: bool | None = None


class AccountResponse(AccountBase):
    """Schema for account response."""

    id: int
    balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
