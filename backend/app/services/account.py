"""Account service for bank account management."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate


class AccountService:
    """Service class for account operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_user_account_types(self, user: User) -> list[str]:
        """Get account types visible to a user based on their username."""
        # Joint accounts are always visible
        visible_types = ["caisse_epargne_joint"]
        
        # Add personal accounts based on username
        username_lower = user.username.lower()
        if username_lower == "seb":
            visible_types.extend(["caisse_epargne_seb", "n26_seb"])
        elif username_lower == "marie":
            visible_types.append("caisse_epargne_marie")
        
        return visible_types

    async def get_by_id(self, account_id: int, user: User | None = None) -> Account | None:
        """Get account by ID, optionally filtered by user visibility."""
        result = await self.db.execute(select(Account).where(Account.id == account_id))
        account = result.scalar_one_or_none()
        
        # If user is provided, check visibility
        if account and user:
            visible_types = self._get_user_account_types(user)
            if account.account_type.value not in visible_types:
                return None
        
        return account

    async def get_all(self, skip: int = 0, limit: int = 100, user: User | None = None) -> list[Account]:
        """Get all active accounts with pagination, filtered by user visibility."""
        query = select(Account).where(Account.is_active)
        
        # Filter by user visibility
        if user:
            visible_types = self._get_user_account_types(user)
            query = query.where(Account.account_type.in_(visible_types))
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, account_data: AccountCreate) -> Account:
        """Create a new account."""
        account = Account(**account_data.model_dump())
        self.db.add(account)
        await self.db.flush()
        await self.db.refresh(account)
        return account

    async def update(self, account_id: int, account_data: AccountUpdate, user: User | None = None) -> Account | None:
        """Update an existing account."""
        account = await self.get_by_id(account_id, user)
        if not account:
            return None

        update_data = account_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)

        await self.db.flush()
        await self.db.refresh(account)
        return account

    async def delete(self, account_id: int, user: User | None = None) -> bool:
        """Soft delete an account."""
        account = await self.get_by_id(account_id, user)
        if not account:
            return False
        account.is_active = False
        await self.db.flush()
        return True

    async def add_funds(self, account_id: int, amount: float, user: User | None = None) -> Account | None:
        """Add funds to an account."""
        account = await self.get_by_id(account_id, user)
        if not account:
            return None
        
        account.balance = float(account.balance) + amount
        await self.db.flush()
        await self.db.refresh(account)
        return account
