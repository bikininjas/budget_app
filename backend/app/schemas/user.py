"""User schemas for authentication and user management."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.user


class UserLogin(BaseModel):
    """Schema for user login."""

    username: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=100)
    full_name: str | None = Field(None, min_length=1, max_length=255)
    password: str | None = Field(None, min_length=8, max_length=100)
    is_active: bool | None = None
    monthly_budget: Decimal | None = Field(None, ge=0, decimal_places=2)


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    email: str
    username: str
    full_name: str
    is_active: bool
    role: UserRole
    monthly_budget: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: int  # user_id
    username: str
    role: str
    exp: datetime


class ChangePassword(BaseModel):
    """Schema for changing password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)


class MagicLinkRequest(BaseModel):
    """Schema for requesting a magic link."""

    email: EmailStr


class MagicLinkVerify(BaseModel):
    """Schema for verifying a magic link token."""

    token: str


class SetInitialPassword(BaseModel):
    """Schema for setting initial password after magic link verification."""

    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UserPasswordStatus(BaseModel):
    """Schema for checking if user has set their password."""

    email: str
    password_set: bool
    user_exists: bool
