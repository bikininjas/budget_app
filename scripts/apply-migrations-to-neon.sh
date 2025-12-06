#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  APPLY MIGRATIONS TO PRODUCTION DATABASE (NEON)               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

log_warning "⚠️  This will apply migrations directly to PRODUCTION Neon database"
log_warning "⚠️  Make sure you have the DATABASE_URL from .env or GCP secrets"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    echo ""
    echo "You need the Neon PostgreSQL connection string from:"
    echo "  - GCP Secret Manager (neon-database-url)"
    echo "  - Or your Neon.tech dashboard"
    echo ""
    echo "Format: postgresql://user:password@host/database?sslmode=require"
    echo ""
    echo "Usage:"
    echo "  export DATABASE_URL='<your-neon-connection-string>'"
    echo "  ./scripts/apply-migrations-to-neon.sh"
    exit 1
fi

log_info "DATABASE_URL is set"
log_info "Database: $(echo $DATABASE_URL | sed 's/@.*/@.../g')" # Hide credentials
echo ""

read -p "Continue with migration? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Migration cancelled"
    exit 0
fi

echo ""
log_info "Checking current migration state..."

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# Show current migration
python -c "
import asyncio
from sqlalchemy import text
from app.core.database import get_db_session

async def check():
    async with get_db_session() as session:
        result = await session.execute(text('SELECT version_num FROM alembic_version'))
        version = result.scalar_one_or_none()
        print(f'Current version: {version}')

asyncio.run(check())
" 2>/dev/null || {
    log_warning "Could not check current version (table might not exist yet)"
}

echo ""
log_info "Running: alembic upgrade head"
echo ""

# Check which python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    log_error "Python not found. Please install Python 3.12+"
    exit 1
fi

# Run migration using python -m alembic (works even if alembic not in PATH)
$PYTHON_CMD -m alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    log_success "✅ Migrations applied successfully!"
    echo ""
    log_info "Verifying migration..."
    
    # Verify monthly_budget column exists
    python -c "
import asyncio
from sqlalchemy import text
from app.core.database import get_db_session

async def verify():
    async with get_db_session() as session:
        # Check if monthly_budget column exists
        result = await session.execute(text(
            \"\"\"SELECT column_name FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'monthly_budget'\"\"\"
        ))
        if result.scalar_one_or_none():
            print('✓ Column monthly_budget exists')
        else:
            print('✗ Column monthly_budget NOT found')
        
        # Check if child_expenses table exists
        result = await session.execute(text(
            \"\"\"SELECT table_name FROM information_schema.tables 
               WHERE table_name = 'child_expenses'\"\"\"
        ))
        if result.scalar_one_or_none():
            print('✓ Table child_expenses exists')
        else:
            print('✗ Table child_expenses NOT found')

asyncio.run(verify())
" 2>/dev/null || log_warning "Could not verify migration"
    
    echo ""
    log_success "Production database updated!"
    log_info "Test the backend: https://backend-budget.novacat.fr/api/health"
    log_info "Try login: https://budget.novacat.fr"
else
    echo ""
    log_error "Migration failed!"
    log_error "Check the error messages above"
    exit 1
fi

cd ..
