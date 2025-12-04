"""Project service for project management."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.project import Project, ProjectContribution
from app.schemas.project import ProjectContributionCreate, ProjectCreate, ProjectUpdate


class ProjectService:
    """Service class for project operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, project_id: int) -> Project | None:
        """Get project by ID with contributions."""
        result = await self.db.execute(
            select(Project)
            .options(joinedload(Project.contributions).joinedload(ProjectContribution.user))
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self, skip: int = 0, limit: int = 100, include_completed: bool = False
    ) -> list[Project]:
        """Get all projects with pagination."""
        query = select(Project).where(Project.is_active)
        if not include_completed:
            query = query.where(Project.is_completed == False)  # noqa: E712
        query = query.offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, project_data: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(**project_data.model_dump())
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def update(self, project_id: int, project_data: ProjectUpdate) -> Project | None:
        """Update an existing project."""
        project = await self.get_by_id(project_id)
        if not project:
            return None

        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project_id: int) -> bool:
        """Soft delete a project."""
        project = await self.get_by_id(project_id)
        if not project:
            return False
        project.is_active = False
        await self.db.flush()
        return True

    async def add_contribution(
        self, contribution_data: ProjectContributionCreate
    ) -> ProjectContribution | None:
        """Add a contribution to a project."""
        # Get the project
        project = await self.get_by_id(contribution_data.project_id)
        if not project:
            return None

        # Create contribution
        contribution = ProjectContribution(**contribution_data.model_dump())
        self.db.add(contribution)

        # Update project's current amount
        project.current_amount += contribution_data.amount

        # Check if project is completed
        if project.current_amount >= project.target_amount:
            project.is_completed = True

        await self.db.flush()
        await self.db.refresh(contribution)
        return contribution

    async def get_contributions(
        self, project_id: int, skip: int = 0, limit: int = 100
    ) -> list[ProjectContribution]:
        """Get all contributions for a project."""
        result = await self.db.execute(
            select(ProjectContribution)
            .options(joinedload(ProjectContribution.user))
            .where(ProjectContribution.project_id == project_id)
            .order_by(ProjectContribution.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def remove_contribution(self, contribution_id: int) -> bool:
        """Remove a contribution from a project."""
        result = await self.db.execute(
            select(ProjectContribution).where(ProjectContribution.id == contribution_id)
        )
        contribution = result.scalar_one_or_none()
        if not contribution:
            return False

        # Update project's current amount
        project = await self.get_by_id(contribution.project_id)
        if project:
            project.current_amount -= contribution.amount
            if project.current_amount < Decimal("0"):
                project.current_amount = Decimal("0")
            project.is_completed = False

        await self.db.delete(contribution)
        await self.db.flush()
        return True
