import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_login_success(client: AsyncClient, db_session):
    """Test successful login."""
    from app.schemas.user import UserCreate
    from app.services.user_service import UserService

    # Create user
    user_service = UserService(db_session)
    await user_service.create_user(
        UserCreate(
            email="login_test@example.com",
            username="login_test",
            full_name="Login Test",
            password="password123",
        )
    )

    # Login
    response = await client.post(
        "/api/auth/login", data={"username": "login_test", "password": "password123"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.anyio
async def test_login_wrong_password(client: AsyncClient):
    """Test login with wrong password."""
    response = await client.post(
        "/api/auth/login", data={"username": "login_test", "password": "wrongpassword"}
    )

    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_current_user(client: AsyncClient, auth_headers):
    """Test getting current user info."""
    response = await client.get("/api/users/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
