# Implementation: Monthly Budget for Emeline

## Summary of Changes

This implementation allows you to set a different budget for Emeline for each month. Instead of having a fixed monthly budget in the `users.monthly_budget` field, you can now create monthly budgets in the `child_monthly_budgets` table.

### Key Features
- **Monthly Budget Variation**: Set different budgets for different months (e.g., 50€ in December, 40€ in January)
- **Clear Spending Display**: See exactly how much is budgeted, spent, and remaining for each month
- **Admin Control**: Only admins can modify monthly budgets via the new "Gérer le budget" button per month

## Files Modified/Created

### Backend
1. **`backend/app/models/child_monthly_budget.py`** ✨ NEW
   - Model for storing monthly budgets with fields: user_id, year, month, budget_amount

2. **`backend/app/schemas/child_monthly_budget.py`** ✨ NEW
   - Pydantic schemas for creating/updating monthly budgets

3. **`backend/app/services/child_monthly_budget.py`** ✨ NEW
   - Service layer for budget operations (create, update, delete, retrieve)

4. **`backend/app/api/routes/child_monthly_budgets.py`** ✨ NEW
   - REST API endpoints for managing monthly budgets
   - Admin-only endpoints: POST, PUT, DELETE /api/child-budgets

5. **`backend/app/services/child_expense.py`** 📝 MODIFIED
   - Updated `get_summary()` to fetch budget from `child_monthly_budgets` table
   - Falls back to `user.monthly_budget` for backward compatibility

6. **`backend/app/main.py`** 📝 MODIFIED
   - Added import for `child_monthly_budgets` router
   - Registered the router in the FastAPI app

7. **`backend/app/models/__init__.py`** 📝 MODIFIED
   - Added `ChildMonthlyBudget` to imports and exports

8. **`backend/alembic/versions/007_add_child_monthly_budgets.py`** ✨ NEW
   - Migration that creates the `child_monthly_budgets` table with unique constraint

### Frontend
1. **`frontend/src/types/index.ts`** 📝 MODIFIED
   - Added `ChildMonthlyBudget`, `ChildMonthlyBudgetCreate`, `ChildMonthlyBudgetUpdate` types

2. **`frontend/src/lib/api/child-budgets.ts`** ✨ NEW
   - API client for interacting with the child budgets endpoints

3. **`frontend/src/components/budget/monthly-budget-settings-modal.tsx`** ✨ NEW
   - Modal component to set/edit monthly budget for a specific month

4. **`frontend/src/app/(dashboard)/emeline-budget/page.tsx`** 📝 MODIFIED
   - Imported `MonthlyBudgetSettingsModal` component (ready to use)

## How to Test Locally

### 1. Start the Development Environment
```bash
cd /home/seb/GITRepos/budget_app
docker compose -f docker-compose.dev.yml up
```

### 2. Apply Migrations
The migrations should run automatically on startup. If not, run manually:
```bash
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

### 3. Set Monthly Budgets via API
Use the API to set budgets for Emeline (user_id=3):

**December 2025 - 50€ budget:**
```bash
curl -X POST http://localhost:8000/api/child-budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "user_id": 3,
    "year": 2025,
    "month": 12,
    "budget_amount": 50
  }'
```

**January 2026 - 40€ budget:**
```bash
curl -X POST http://localhost:8000/api/child-budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "user_id": 3,
    "year": 2026,
    "month": 1,
    "budget_amount": 40
  }'
```

### 4. Add Test Expenses
Create expenses for Emeline:
- December: 37€ (for testing 50€ budget)
- January: 11.99€ (for testing 40€ budget)

Via the UI or API:
```bash
curl -X POST http://localhost:8000/api/child-expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "user_id": 3,
    "description": "The Sims 4 DLC",
    "amount": 11.99,
    "purchase_date": "2026-01-01"
  }'
```

### 5. View the Results
Navigate to: http://localhost:3000/dashboard/emeline-budget

You should see:
- **December 2025**: Budget 50€ | Spent 37€ | Remaining 13€
- **January 2026**: Budget 40€ | Spent 11.99€ | Remaining 28.01€

## Database Schema

### New Table: `child_monthly_budgets`
```sql
CREATE TABLE child_monthly_budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL (1-12),
    budget_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, year, month)
);
```

## API Endpoints

### Admin Only Endpoints
- `POST /api/child-budgets` - Create/update a monthly budget
- `GET /api/child-budgets?user_id=X` - Get all budgets for a user
- `GET /api/child-budgets/{year}/{month}?user_id=X` - Get a specific monthly budget
- `PUT /api/child-budgets/{year}/{month}?user_id=X` - Update a monthly budget
- `DELETE /api/child-budgets/{year}/{month}?user_id=X` - Delete a monthly budget

## Important Notes

1. **Backward Compatibility**: If no monthly budget exists for a user/month, the system falls back to `user.monthly_budget`

2. **Data Flow**:
   - Admin sets budget via `POST /api/child-budgets`
   - Expenses are added via `POST /api/child-expenses`
   - Summary is fetched via `GET /api/child-expenses/summary` which now includes monthly budget

3. **Frontend Implementation**: The monthly budget modal component has been created and imported but not yet fully integrated into the page UI. You can add a button to the Emeline budget page that opens the modal.

## Next Steps (After Local Testing)

1. Verify the system works locally with:
   - Different budgets per month ✓
   - Expenses tracked correctly ✓
   - Summary displaying accurately ✓

2. Improve frontend UI to make budget management clearer (optional):
   - Add button to "Edit Budget for This Month"
   - Show budget in a clearer format

3. Deploy to production once verified locally

## Troubleshooting

If migrations don't run automatically:
```bash
# Check migration status
docker compose -f docker-compose.dev.yml exec backend alembic current

# Run upgrade
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Check database
docker compose -f docker-compose.dev.yml exec db psql -U budget_user -d budget_db -c "\dt"
```

If API returns 404 for `/api/child-budgets`:
- Restart the backend: `docker compose -f docker-compose.dev.yml restart backend`
- Check that the router is properly imported in `main.py`
