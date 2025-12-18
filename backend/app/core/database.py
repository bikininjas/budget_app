"""Database configuration and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Enhanced engine configuration for Neon database compatibility
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    pool_size=10,  # Appropriate pool size for serverless
    max_overflow=20,  # Allow some overflow
    connect_args={
        "sslmode": "require",
        "application_name": "budget-backend",
        "connect_timeout": 10,
    }
    if "neon.tech" in settings.database_url
    else {},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session with enhanced error handling."""
    async with AsyncSessionLocal() as session:
        try:
            # Test database connection before yielding
            if "neon.tech" in settings.database_url:
                await session.execute("SELECT 1")  # Simple query to test connection

            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            # Provide more context for database errors
            error_msg = f"Database operation failed: {str(e)}"
            if "neon.tech" in settings.database_url:
                error_msg += " (Neon database connection issue)"
            raise RuntimeError(error_msg) from e
        finally:
            await session.close()
