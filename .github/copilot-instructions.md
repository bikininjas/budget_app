# Copilot Instructions for DuoBudget

## Architecture Overview

Family budget app for Marie, Seb, and child user Emeline. Tracks expenses, splits costs, forecasts budgets.

**Stack**: FastAPI 3.12 + SQLAlchemy 2.0 async → PostgreSQL 16 | Next.js 15 + React 19 + TanStack Query v5

**Deployment**: Google Cloud Run (europe-west1), Neon.tech PostgreSQL (prod), GitHub Actions CI/CD

**User Roles**: `admin`, `user`, `child` (Emeline has `monthly_budget` field, limited access to own expenses)

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
Always use `select()` with `joinedload()` for eager loading (avoid N+1):
```python
result = await self.db.execute(
    select(Expense)
    .options(joinedload(Expense.category), joinedload(Expense.account))
    .where(Expense.is_active)
)
```

### Key Domain Types & Enum Values
- `SplitType`: `fifty_fifty`, `one_third_two_thirds`, `two_thirds_one_third`, `full_marie`, `full_seb`, `full_emeline`
- `Frequency`: `one_time`, `monthly`, `quarterly`, `annual`
- `UserRole`: `admin`, `user`, `child`

**CRITICAL**: Use lowercase enum values (e.g., `SplitType.fifty_fifty` NOT `SplitType.EQUAL`)

### Migrations
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head
```

**Enum additions**: PostgreSQL requires explicit commit before using new enum values:
```python
connection.execute(text("ALTER TYPE splittype ADD VALUE IF NOT EXISTS '100_emeline'"))
connection.commit()  # Must commit before INSERT
```

## Frontend Patterns (`frontend/`)

### API Client (TanStack Query v5)
All API calls through `src/lib/api/{resource}.ts` → consumed via TanStack Query in components:
```typescript
const { data: expenses } = useQuery({
  queryKey: ['expenses', filters],
  queryFn: () => expensesApi.getAll(filters)
});

const createMutation = useMutation({
  mutationFn: expensesApi.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
});
```

### Build-time API URL
`NEXT_PUBLIC_API_URL` is baked at build. Cloud Run workflow passes it as `--build-arg` to Docker build.

### Types Mirror Backend
`src/types/index.ts` must match Pydantic schemas exactly. When adding backend fields, update both.

### Icons
Use `lucide-react` NOT `@heroicons/react`. Common: `Plus`, `Pencil`, `Trash2`, `Link`.

## Development Workflows

- Create scripts in `scripts/` for repetitive tasks such as test builds, linting, endpoints testing.
- Always run full local tests before pushing code (frontend + backend).
- Do not use "gh" cli as it blocks copilot from suggesting commands because it takes over the terminal. Use standard git commands instead or github api by curl.
- Use /usr/bin/grep instead of grep alias that may include color codes breaking scripts.
- Always use "bun" instead of "npm" or "yarn" for frontend commands.
- Always build locally with Docker before pushing code to verify no build errors.
- Always check for linting issues and type errors before committing code for the whole project (frontend + backend).
- Always format and check backend code with "ruff" before committing (--fix option always enabled).

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
1. User creates expense → assigned to Marie, Seb, or Emeline
2. Split type determines payment shares (50/50, 33/67, 100% individual)
3. `calculate_user_balance()` computes who owes whom based on `assigned_to` and `split_type`

### Recurring Charges vs Expenses
- `recurring_charges` table = budget forecasts only (loyer, assurances)
- `expenses` with `is_recurring=true` = actual tracked recurring expenses
- Different purposes: forecasting vs tracking

### Child User Budget (Emeline)
- `UserRole.child` with `monthly_budget` field (adjustable)
- Separate `child_expenses` table for tracking purchases
- Access control: children see only own data, parents see all
- API: `/api/child-expenses` with role-based filtering

### Authentication
JWT tokens (7-day expiry). Magic link flow for password setup via SMTP.

## Key Files Reference
- `backend/app/core/config.py` - All env vars with defaults (CORS_ORIGINS, DATABASE_URL, SMTP)
- `backend/app/models/` - SQLAlchemy models (lowercase enum values in code)
- `backend/alembic/versions/` - DB migrations (001-005 numbered, commit enums before INSERT)
- `frontend/src/types/index.ts` - TypeScript types mirroring Pydantic schemas
- `frontend/src/lib/api/client.ts` - Axios instance with auth interceptor
- `.github/workflows/deploy.yml` - CI/CD: auto-deploys master → Cloud Run
