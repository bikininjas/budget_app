"""Category service for expense categorization."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    """Service class for category operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, category_id: int) -> Category | None:
        """Get category by ID."""
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Category | None:
        """Get category by name."""
        result = await self.db.execute(select(Category).where(Category.name == name))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Category]:
        """Get all active categories with pagination."""
        result = await self.db.execute(
            select(Category).where(Category.is_active).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, category_data: CategoryCreate) -> Category:
        """Create a new category."""
        category = Category(**category_data.model_dump())
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def update(self, category_id: int, category_data: CategoryUpdate) -> Category | None:
        """Update an existing category."""
        category = await self.get_by_id(category_id)
        if not category:
            return None

        update_data = category_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)

        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def delete(self, category_id: int) -> bool:
        """Soft delete a category."""
        category = await self.get_by_id(category_id)
        if not category:
            return False
        category.is_active = False
        await self.db.flush()
        return True
