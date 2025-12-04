"""Account management routes."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.account import AccountService

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("/", response_model=list[AccountResponse])
async def list_accounts(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> list[AccountResponse]:
    """Get accounts visible to current user (personal + joint)."""
    account_service = AccountService(db)
    accounts = await account_service.get_all(skip=skip, limit=limit, user=current_user)
    return [AccountResponse.model_validate(acc) for acc in accounts]


@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    db: DbSession,
    _current_user: CurrentUser,
) -> AccountResponse:
    """Create a new account."""
    account_service = AccountService(db)
    account = await account_service.create(account_data)
    return AccountResponse.model_validate(account)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> AccountResponse:
    """Get a specific account by ID (only if user has access)."""
    account_service = AccountService(db)
    account = await account_service.get_by_id(account_id, user=current_user)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied",
        )
    return AccountResponse.model_validate(account)


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_data: AccountUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> AccountResponse:
    """Update an account (only if user has access)."""
    account_service = AccountService(db)
    updated_account = await account_service.update(account_id, account_data, user=current_user)
    if not updated_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied",
        )
    return AccountResponse.model_validate(updated_account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    """Delete an account (only if user has access)."""
    account_service = AccountService(db)
    success = await account_service.delete(account_id, user=current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied",
        )
