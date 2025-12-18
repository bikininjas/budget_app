"""API dependencies for authentication and database access."""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.services.user import UserService

# Configure logger
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get the current authenticated user from JWT token."""
    logger.debug(f"🔐 Authenticating token: {token[:20]}...")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        logger.debug("❌ Token decoding failed")
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        logger.debug("❌ Token missing user ID")
        raise credentials_exception

    logger.debug(f"👤 Looking up user ID: {user_id}")
    user_service = UserService(db)
    user = await user_service.get_by_id(int(user_id))
    if user is None:
        logger.debug(f"❌ User not found: {user_id}")
        raise credentials_exception
    if not user.is_active:
        logger.debug(f"⚠️  Inactive user: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    logger.debug(f"✅ Authentication successful for user: {user.username}")
    return user


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require admin role for access."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# Type aliases for cleaner dependencies
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_current_admin_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
