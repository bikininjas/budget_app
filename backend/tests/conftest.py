import contextlib

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

# Use the database URL from settings (already configured for tests by ci script)
# ci-backend-test-with-docker.sh sets DATABASE_URL to test database
TEST_DATABASE_URL = settings.database_url

engine = create_async_engine(TEST_DATABASE_URL, echo=False, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
async def auth_headers(client: AsyncClient, db_session: AsyncSession):
    """Get authentication headers for a test user."""
    from app.schemas.user import UserCreate
    from app.services.user import UserService

    user_service = UserService(db_session)

    # Create test user
    user_data = UserCreate(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        password="testpassword123",
    )

    with contextlib.suppress(Exception):
        await user_service.create(user_data)
        await db_session.commit()

    # Login
    response = await client.post(
        "/api/auth/login", data={"username": "testuser", "password": "testpassword123"}
    )

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
