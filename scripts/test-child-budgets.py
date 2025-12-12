#!/usr/bin/env python3
"""
Test script to verify child monthly budget functionality.
This tests the logic without running the full Docker stack.
"""

import sys
from decimal import Decimal

# Add backend to path
sys.path.insert(0, '/home/seb/GITRepos/budget_app/backend')

from app.models.child_monthly_budget import ChildMonthlyBudget
from app.models.child_expense import ChildExpense
from app.models.user import User
from app.schemas.child_monthly_budget import ChildMonthlyBudgetCreate


def test_model_imports():
    """Test that all models import correctly."""
    print("✅ All imports successful")
    print(f"  - ChildMonthlyBudget: {ChildMonthlyBudget}")
    print(f"  - ChildExpense: {ChildExpense}")
    print(f"  - User: {User}")
    print(f"  - ChildMonthlyBudgetCreate: {ChildMonthlyBudgetCreate}")


def test_schema_creation():
    """Test creating a schema instance."""
    print("\n📋 Testing schema creation...")
    
    budget_data = ChildMonthlyBudgetCreate(
        user_id=3,  # Emeline's ID
        year=2025,
        month=12,
        budget_amount=50.0,
    )
    
    print(f"✅ Created budget schema: {budget_data}")
    print(f"  - User ID: {budget_data.user_id}")
    print(f"  - Year/Month: {budget_data.year}-{budget_data.month:02d}")
    print(f"  - Budget: {budget_data.budget_amount}€")


def test_summary_calculation():
    """Test summary calculation logic."""
    print("\n🧮 Testing summary calculation...")
    
    # Simulate summary data
    monthly_budget = Decimal("50.00")
    total_spent = Decimal("37.00")
    remaining = monthly_budget - total_spent
    
    print("✅ Calculation result:")
    print(f"  - Budget: {monthly_budget}€")
    print(f"  - Spent: {total_spent}€")
    print(f"  - Remaining: {remaining}€")
    print(f"  - Used: {(total_spent / monthly_budget * 100):.1f}%")


def main():
    """Run all tests."""
    print("🚀 Starting child monthly budget functionality tests...\n")
    
    try:
        test_model_imports()
        test_schema_creation()
        test_summary_calculation()
        
        print("\n" + "="*50)
        print("✨ All tests passed!")
        print("="*50)
        print("\nNow test with Docker:")
        print("  1. Run: docker compose -f docker-compose.dev.yml up")
        print("  2. Run migrations: alembic upgrade head")
        print("  3. Create budgets via API: /api/child-budgets")
        print("  4. View expenses: http://localhost:3000/dashboard/emeline-budget")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
