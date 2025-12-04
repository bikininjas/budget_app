import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_create_expense(client: AsyncClient, auth_headers, db_session):
    """Test creating an expense."""
    from app.schemas.account import AccountCreate
    from app.schemas.category import CategoryCreate
    from app.services.account_service import AccountService
    from app.services.category_service import CategoryService

    # Create category
    category_service = CategoryService(db_session)
    category = await category_service.create_category(
        CategoryCreate(name="Test Category", color="#FF0000")
    )

    # Create account
    account_service = AccountService(db_session)
    account = await account_service.create_account(
        AccountCreate(name="Test Account", account_type="caisse_epargne_joint")
    )

    # Get user id
    response = await client.get("/api/users/me", headers=auth_headers)
    user_id = response.json()["id"]

    # Create expense
    expense_data = {
        "label": "Test Expense",
        "amount": 100.50,
        "date": "2024-01-15",
        "category_id": category.id,
        "account_id": account.id,
        "assigned_to": user_id,
        "split_type": "50_50",
        "frequency": "one_time",
    }

    response = await client.post("/api/expenses", json=expense_data, headers=auth_headers)

    assert response.status_code == 201
    data = response.json()
    assert data["label"] == "Test Expense"
    assert float(data["amount"]) == 100.50


@pytest.mark.anyio
async def test_get_expenses(client: AsyncClient, auth_headers):
    """Test getting list of expenses."""
    response = await client.get("/api/expenses", headers=auth_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_get_monthly_stats(client: AsyncClient, auth_headers):
    """Test getting monthly stats."""
    response = await client.get("/api/expenses/stats/monthly/2024", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
