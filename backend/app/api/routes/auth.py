"""Authentication routes."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_magic_link_token,
    get_password_hash,
    verify_magic_link_token,
    verify_password,
)
from app.schemas.user import (
    ChangePassword,
    MagicLinkRequest,
    SetInitialPassword,
    Token,
    UserCreate,
    UserPasswordStatus,
    UserResponse,
)
from app.services.email import send_magic_link_email
from app.services.user import UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
) -> Token:
    """Authenticate user and return JWT token."""
    user_service = UserService(db)
    user = await user_service.authenticate(form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value,
        }
    )

    return Token(access_token=access_token)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: DbSession,
) -> UserResponse:
    """Register a new user."""
    user_service = UserService(db)

    # Check if user already exists
    existing_user = await user_service.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    existing_username = await user_service.get_by_username(user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    user = await user_service.create(user_data)
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser) -> UserResponse:
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: CurrentUser) -> Token:
    """Refresh JWT token for authenticated user."""
    access_token = create_access_token(
        data={
            "sub": str(current_user.id),
            "username": current_user.username,
            "role": current_user.role.value,
        }
    )
    return Token(access_token=access_token)


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    """Change password for authenticated user."""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect",
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.flush()

    return {"message": "Mot de passe modifié avec succès"}


@router.post("/check-email", response_model=UserPasswordStatus)
async def check_email_status(
    data: MagicLinkRequest,
    db: DbSession,
) -> UserPasswordStatus:
    """Check if email exists and if password has been set."""
    user_service = UserService(db)
    user = await user_service.get_by_email(data.email)

    if not user:
        return UserPasswordStatus(
            email=data.email,
            password_set=False,
            user_exists=False,
        )

    return UserPasswordStatus(
        email=data.email,
        password_set=user.password_set,
        user_exists=True,
    )


@router.post("/request-magic-link")
async def request_magic_link(
    data: MagicLinkRequest,
    db: DbSession,
) -> dict:
    """Request a magic link to set initial password.

    Only works for users who haven't set their password yet.
    """
    user_service = UserService(db)
    user = await user_service.get_by_email(data.email)

    # Always return success to prevent email enumeration
    if not user:
        logger.warning(f"Magic link requested for non-existent email: {data.email}")
        return {"message": "Si cet email existe, un lien vous a été envoyé."}

    if user.password_set:
        logger.warning(f"Magic link requested for user with password already set: {data.email}")
        return {"message": "Si cet email existe, un lien vous a été envoyé."}

    # Generate magic link token
    token = create_magic_link_token(user.id, user.email)
    magic_link = f"{settings.frontend_url}/set-password?token={token}"

    # Send email
    email_sent = await send_magic_link_email(user.email, magic_link, user.full_name)

    if not email_sent:
        logger.error(f"Failed to send magic link email to {user.email}")
        # Still return success to prevent enumeration
        return {"message": "Si cet email existe, un lien vous a été envoyé."}

    logger.info(f"Magic link sent to {user.email}")
    return {"message": "Si cet email existe, un lien vous a été envoyé."}


@router.post("/verify-magic-link")
async def verify_magic_link(
    token: str,
    db: DbSession,
) -> dict:
    """Verify a magic link token.

    Returns user info if token is valid.
    """
    payload = verify_magic_link_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expiré",
        )

    user_id = int(payload["sub"])
    user_service = UserService(db)
    user = await user_service.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur non trouvé",
        )

    if user.password_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe déjà défini",
        )

    return {
        "valid": True,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/set-initial-password", response_model=Token)
async def set_initial_password(
    data: SetInitialPassword,
    db: DbSession,
) -> Token:
    """Set initial password using magic link token.

    Returns JWT token on success.
    """
    payload = verify_magic_link_token(data.token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expiré",
        )

    user_id = int(payload["sub"])
    user_service = UserService(db)
    user = await user_service.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur non trouvé",
        )

    if user.password_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe déjà défini",
        )

    # Set the password
    user.hashed_password = get_password_hash(data.new_password)
    user.password_set = True
    await db.flush()

    logger.info(f"Initial password set for user {user.email}")

    # Return access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value,
        }
    )

    return Token(access_token=access_token)
