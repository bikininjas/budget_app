"""Database configuration and session management."""

import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Configure logger
logger = logging.getLogger(__name__)

# Enhanced engine configuration for Neon database compatibility
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    pool_size=10,  # Appropriate pool size for serverless
    max_overflow=20,  # Allow some overflow
    connect_args={
        "ssl": True,  # asyncpg uses boolean ssl, not sslmode string
        "application_name": "budget-backend",
        "connect_timeout": 10,
    } if "neon.tech" in settings.database_url else {},
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
                logger.debug("🔌 Testing Neon database connection...")
                await session.execute(text("SELECT 1"))  # Simple query to test connection
                logger.debug("✅ Database connection successful")

            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            # Provide more context for database errors
            error_msg = f"Database operation failed: {str(e)}"
            if "neon.tech" in settings.database_url:
                error_msg += " (Neon database connection issue)"

            # Log detailed error information
            logger.error(f"💥 DATABASE ERROR: {error_msg}")
            if hasattr(e, '__cause__'):
                logger.debug(f"   Root cause: {e.__cause__}")

            raise RuntimeError(error_msg) from e
        finally:
            await session.close()
