-- Test data for Emeline's monthly budgets
-- This script finds Emeline's actual user_id from the database

-- Get Emeline's user_id (she's created as a child user in migrations)
-- December 2025: 50€ budget
INSERT INTO child_monthly_budgets (user_id, year, month, budget_amount, created_at, updated_at)
SELECT id, 2025, 12, 50.00, NOW(), NOW() FROM users WHERE username = 'emeline'
ON CONFLICT (user_id, year, month) DO UPDATE SET budget_amount = 50.00;

-- January 2026: 40€ budget
INSERT INTO child_monthly_budgets (user_id, year, month, budget_amount, created_at, updated_at)
SELECT id, 2026, 1, 40.00, NOW(), NOW() FROM users WHERE username = 'emeline'
ON CONFLICT (user_id, year, month) DO UPDATE SET budget_amount = 40.00;

-- View the inserted data
SELECT user_id, year, month, budget_amount FROM child_monthly_budgets 
WHERE user_id = (SELECT id FROM users WHERE username = 'emeline')
ORDER BY year, month;
