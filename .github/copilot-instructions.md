# Copilot Instructions for DuoBudget

## Architecture Overview

Do not use "gh" cli as it blocks copilot from suggesting commands because it takes over the terminal. Use standard git commands instead or github api by curl.

Two-user budget app (Marie & Seb) with expense splitting, tracking, and forecasting.

**Stack**: FastAPI 3.12 + SQLAlchemy 2.0 async → PostgreSQL 16 | Next.js 15 + React 19 + TanStack Query

**Deployment**: Google Cloud Run (europe-west1), Neon.tech PostgreSQL (prod)

## Backend Patterns (`backend/`)

### Service-Layer Architecture
All business logic lives in `app/services/`. Routes in `app/api/routes/` are thin wrappers:
```python
# Routes inject service via dependency
async def create_expense(db: DbSession, current_user: CurrentUser, data: ExpenseCreate):
    service = ExpenseService(db)
    return await service.create(data, current_user.id)
```

### Async SQLAlchemy
Always use `select()` with `joinedload()` for relations:
```python
result = await self.db.execute(
    select(Expense).options(joinedload(Expense.category), joinedload(Expense.account))
)
```

### Key Domain Types
- `SplitType`: `50_50`, `33_67`, `67_33`, `100_marie`, `100_seb`
- `Frequency`: `one_time`, `monthly`, `quarterly`, `annual`

### Migrations
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head
```

## Frontend Patterns (`frontend/`)

### API Client (TanStack Query)
All API calls go through `src/lib/api/` hooks. Example pattern:
```typescript
export function useExpenses(filters?: ExpenseFilter) {
  return useQuery({ queryKey: ['expenses', filters], queryFn: () => expenseApi.getAll(filters) });
}
```

### Build-time API URL
`NEXT_PUBLIC_API_URL` is baked at build time. For Cloud Run, the workflow passes it as `--build-arg`.

### Types Mirror Backend
Types in `src/types/index.ts` must match Pydantic schemas exactly. When adding backend fields, update both.

## Development Workflows

### Local (Docker)
```bash
# Requires .env with POSTGRES_PASSWORD and SECRET_KEY
docker compose -f docker-compose.dev.yml up
# Frontend: localhost:3000, Backend: localhost:8000
```

### CI Scripts
```bash
./scripts/ci-all.sh              # Run full CI locally
./scripts/ci-backend-lint.sh     # Ruff check + format
./scripts/ci-backend-test.sh     # Pytest (needs DB)
./scripts/ci-frontend-lint.sh    # ESLint + TypeScript
```

### Linting
- **Backend**: `ruff check . && ruff format .`
- **Frontend**: `bun lint` (ESLint)

## Deployment (Cloud Run)

### GitHub Actions Workflow
Push to `master` triggers `.github/workflows/deploy.yml`:
1. Detects changes in `backend/` or `frontend/`
2. Builds Docker images → pushes to Artifact Registry
3. Deploys to Cloud Run with secrets from GCP Secret Manager

### Manual Deploy
Trigger via GitHub Actions UI or use the API:
```bash
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/bikininjas/budget_app/actions/workflows/deploy.yml/dispatches \
  -d '{"ref":"master","inputs":{"deploy_backend":"true","deploy_frontend":"true"}}'
```

### CORS Configuration
Backend CORS is set via `CORS_ORIGINS` env var. The workflow auto-updates it with frontend URL after deployment.

## Project Conventions

### Expense Flow
1. User creates expense → assigned to Marie or Seb
2. Split type determines who pays what percentage
3. Balance calculated: who owes whom

### Recurring Charges vs Expenses
- `recurring_charges` = fixed budget forecasts (loyer, assurances)
- `expenses` with `is_recurring=true` = tracked recurring expenses

### Authentication
JWT tokens (7-day expiry). Magic link flow for password setup via email (SMTP).

## Key Files Reference
- `backend/app/core/config.py` - All env vars with defaults
- `backend/alembic/versions/` - DB migrations (numbered)
- `frontend/src/lib/api/client.ts` - Axios instance with auth interceptor
- `.github/workflows/deploy.yml` - CI/CD pipeline
