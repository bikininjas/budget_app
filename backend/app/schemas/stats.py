"""Statistics schemas for dashboard and reports."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class CategoryStats(BaseModel):
    """Statistics for a single category."""

    category_id: int
    category_name: str
    color: str
    total_amount: Decimal
    expense_count: int
    percentage: float


class MonthlyStats(BaseModel):
    """Monthly expense statistics."""

    year: int
    month: int
    total_amount: Decimal
    expense_count: int
    by_category: list[CategoryStats]


class UserBalanceStats(BaseModel):
    """Balance statistics between users."""

    user_id: int
    user_name: str
    total_paid: Decimal
    should_have_paid: Decimal
    balance: Decimal  # Positive = owes money, Negative = is owed money


class DashboardStats(BaseModel):
    """Overall dashboard statistics."""

    total_expenses: Decimal
    total_expenses_this_month: Decimal
    expense_count: int
    expense_count_this_month: int
    categories_breakdown: list[CategoryStats]
    monthly_trend: list[MonthlyStats]
    user_balances: list[UserBalanceStats]
    top_categories: list[CategoryStats]
    recent_expenses_count: int
    start_date: date | None = None
    end_date: date | None = None
