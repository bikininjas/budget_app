"""Project schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Base project schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    target_amount: Decimal = Field(..., gt=0)
    deadline: datetime | None = None


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""

    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    target_amount: Decimal | None = Field(None, gt=0)
    deadline: datetime | None = None
    is_active: bool | None = None
    is_completed: bool | None = None


class ProjectResponse(ProjectBase):
    """Schema for project response."""

    id: int
    current_amount: Decimal
    is_active: bool
    is_completed: bool
    progress_percentage: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectContributionBase(BaseModel):
    """Base project contribution schema."""

    amount: Decimal = Field(..., gt=0)
    note: str | None = None


class ProjectContributionCreate(ProjectContributionBase):
    """Schema for creating a project contribution."""

    project_id: int
    user_id: int


class ProjectContributionResponse(ProjectContributionBase):
    """Schema for project contribution response."""

    id: int
    project_id: int
    user_id: int
    created_at: datetime

    # Nested data
    user_name: str | None = None

    model_config = {"from_attributes": True}
