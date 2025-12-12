# Quick Start - Testing Monthly Budgets Locally

## 30-Second Setup

```bash
cd /home/seb/GITRepos/budget_app
./scripts/test-monthly-budgets.sh
```

The script will:
1. Start Docker services
2. Run database migrations
3. Create test budgets for Emeline:
   - December 2025: 50€
   - January 2026: 40€
4. Verify everything is working
5. Show you where to test

## Testing in the UI

### Step 1: View Emeline's Budget Page
Open http://localhost:3000/dashboard/emeline-budget

### Step 2: Select December 2025
- Budget dropdown → December
- You should see: **Budget: 50.00€**

### Step 3: Add a Test Expense
- Click "Nouvelle dépense"
- Description: "Test purchase"
- Amount: 37.00
- Date: December 2025
- Click "Créer"

### Step 4: Check the Results
After adding the expense, you should see:
```
Budget mensuel:     50.00€
Dépensé:           37.00€
Restant:           13.00€
Utilisé:           74.0%
```

### Step 5: Test January 2026
- Budget dropdown → January 2026
- Add expense: 11.99€
- Check: Budget 40€, Spent 11.99€, Remaining 28.01€

## API Testing (Optional)

### Get Budget for December 2025
```bash
curl -X GET "http://localhost:8000/api/child-budgets/2025/12?user_id=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Budget for February 2026
```bash
curl -X POST "http://localhost:8000/api/child-budgets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": 3,
    "year": 2026,
    "month": 2,
    "budget_amount": 35
  }'
```

## Stopping Services

```bash
docker compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Backend not starting
```bash
docker compose -f docker-compose.dev.yml logs backend
```

### Migrations failed
```bash
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

### Can't see the budget
1. Check Emeline exists: http://localhost:8000/api/docs → Users → GET /api/users
2. Check budget was created: Database → `SELECT * FROM child_monthly_budgets`
3. Restart backend: `docker compose -f docker-compose.dev.yml restart backend`

## Success Criteria

✅ Script runs without errors
✅ Budget shows in UI for December and January
✅ Adding expenses updates remaining budget
✅ Calculations are correct

If all green, the implementation is ready for production!
