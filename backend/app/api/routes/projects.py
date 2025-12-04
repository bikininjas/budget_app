"""Project management routes."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.project import (
    ProjectContributionCreate,
    ProjectContributionResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    db: DbSession,
    _current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    include_completed: bool = False,
) -> list[ProjectResponse]:
    """Get all projects."""
    project_service = ProjectService(db)
    projects = await project_service.get_all(
        skip=skip, limit=limit, include_completed=include_completed
    )
    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            target_amount=p.target_amount,
            current_amount=p.current_amount,
            deadline=p.deadline,
            is_active=p.is_active,
            is_completed=p.is_completed,
            progress_percentage=p.progress_percentage,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in projects
    ]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: DbSession,
    _current_user: CurrentUser,
) -> ProjectResponse:
    """Create a new project."""
    project_service = ProjectService(db)
    project = await project_service.create(project_data)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        target_amount=project.target_amount,
        current_amount=project.current_amount,
        deadline=project.deadline,
        is_active=project.is_active,
        is_completed=project.is_completed,
        progress_percentage=project.progress_percentage,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> ProjectResponse:
    """Get a specific project by ID."""
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        target_amount=project.target_amount,
        current_amount=project.current_amount,
        deadline=project.deadline,
        is_active=project.is_active,
        is_completed=project.is_completed,
        progress_percentage=project.progress_percentage,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: DbSession,
    _current_user: CurrentUser,
) -> ProjectResponse:
    """Update a project."""
    project_service = ProjectService(db)
    project = await project_service.update(project_id, project_data)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        target_amount=project.target_amount,
        current_amount=project.current_amount,
        deadline=project.deadline,
        is_active=project.is_active,
        is_completed=project.is_completed,
        progress_percentage=project.progress_percentage,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> None:
    """Delete a project."""
    project_service = ProjectService(db)
    success = await project_service.delete(project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


@router.post(
    "/{project_id}/contributions",
    response_model=ProjectContributionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_contribution(
    project_id: int,
    contribution_data: ProjectContributionCreate,
    db: DbSession,
    _current_user: CurrentUser,
) -> ProjectContributionResponse:
    """Add a contribution to a project."""
    if contribution_data.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID mismatch",
        )

    project_service = ProjectService(db)
    contribution = await project_service.add_contribution(contribution_data)
    if not contribution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return ProjectContributionResponse(
        id=contribution.id,
        amount=contribution.amount,
        note=contribution.note,
        project_id=contribution.project_id,
        user_id=contribution.user_id,
        created_at=contribution.created_at,
        user_name=contribution.user.full_name if contribution.user else None,
    )


@router.get("/{project_id}/contributions", response_model=list[ProjectContributionResponse])
async def list_contributions(
    project_id: int,
    db: DbSession,
    _current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> list[ProjectContributionResponse]:
    """Get all contributions for a project."""
    project_service = ProjectService(db)
    contributions = await project_service.get_contributions(project_id, skip=skip, limit=limit)
    return [
        ProjectContributionResponse(
            id=c.id,
            amount=c.amount,
            note=c.note,
            project_id=c.project_id,
            user_id=c.user_id,
            created_at=c.created_at,
            user_name=c.user.full_name if c.user else None,
        )
        for c in contributions
    ]


@router.delete(
    "/{project_id}/contributions/{contribution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_contribution(
    _project_id: int,
    contribution_id: int,
    db: DbSession,
    _current_user: CurrentUser,
) -> None:
    """Remove a contribution from a project."""
    project_service = ProjectService(db)
    success = await project_service.remove_contribution(contribution_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution not found",
        )
