"""Category management routes."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: DbSession,
    _current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> list[CategoryResponse]:
    """Get all active categories."""
    category_service = CategoryService(db)
    categories = await category_service.get_all(skip=skip, limit=limit)
    return [CategoryResponse.model_validate(cat) for cat in categories]


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: DbSession,
    _current_user: CurrentUser,
) -> CategoryResponse:
    """Create a new category."""
    category_service = CategoryService(db)

    # Check if category already exists
    existing = await category_service.get_by_name(category_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )

    category = await category_service.create(category_data)
    return CategoryResponse.model_validate(category)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> CategoryResponse:
    """Get a specific category by ID."""
    category_service = CategoryService(db)
    category = await category_service.get_by_id(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return CategoryResponse.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: DbSession,
    _current_user: CurrentUser,
) -> CategoryResponse:
    """Update a category."""
    category_service = CategoryService(db)
    category = await category_service.update(category_id, category_data)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> None:
    """Delete a category."""
    category_service = CategoryService(db)
    success = await category_service.delete(category_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
