"""Security utilities - password hashing and JWT tokens."""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_magic_link_token(user_id: int, email: str) -> str:
    """Create a magic link token for password setup.

    Args:
        user_id: The user's ID
        email: The user's email

    Returns:
        A JWT token for magic link verification
    """
    expire = datetime.now(UTC) + timedelta(minutes=settings.magic_link_expire_minutes)
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "type": "magic_link",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_magic_link_token(token: str) -> dict[str, Any] | None:
    """Verify a magic link token.

    Args:
        token: The magic link JWT token

    Returns:
        The token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "magic_link":
            return None
        return payload
    except JWTError:
        return None


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None
