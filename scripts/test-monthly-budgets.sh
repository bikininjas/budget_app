#!/bin/bash
# Complete testing script for Emeline's monthly budget feature

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/seb/GITRepos/budget_app"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Testing Monthly Budget Feature${NC}"
echo -e "${BLUE}================================${NC}"

# Function to print progress
progress() {
    echo -e "${YELLOW}➜${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if docker is running
progress "Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
    exit 1
fi
success "Docker is running"

# Start services
progress "Starting Docker services..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.dev.yml down 2>/dev/null || true
docker compose -f docker-compose.dev.yml up -d db backend 2>&1 | grep -E "Creating|Starting" || true

# Wait for services to be ready
progress "Waiting for services to be ready (30s)..."
sleep 30

# Check if database is ready
progress "Checking database connection..."
for i in {1..30}; do
    if docker compose -f docker-compose.dev.yml exec -T db psql -U budget_user -d budget_db -c "SELECT 1" > /dev/null 2>&1; then
        success "Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        error "Database failed to start"
        exit 1
    fi
    sleep 1
done

# Run migrations
progress "Running database migrations..."
if docker compose -f docker-compose.dev.yml exec -T backend alembic upgrade head > /dev/null 2>&1; then
    success "Migrations completed"
else
    error "Migrations failed"
    docker compose -f docker-compose.dev.yml logs backend | tail -30
    exit 1
fi

# Load test data
progress "Loading test data for Emeline's budgets..."
if docker compose -f docker-compose.dev.yml exec -T db psql -U budget_user -d budget_db < "$PROJECT_DIR/scripts/test-data-emeline-budgets.sql" > /dev/null 2>&1; then
    success "Test data loaded"
else
    error "Failed to load test data"
fi

# Verify the table exists
progress "Verifying child_monthly_budgets table..."
TABLE_CHECK=$(docker compose -f docker-compose.dev.yml exec -T db psql -U budget_user -d budget_db -tc "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='child_monthly_budgets');")
if [[ $TABLE_CHECK == *"t"* ]]; then
    success "Table exists"
else
    error "Table not found"
    exit 1
fi

# Check test data
progress "Verifying test data..."
EMELINE_ID=$(docker compose -f docker-compose.dev.yml exec -T db psql -U budget_user -d budget_db -tc "SELECT id FROM users WHERE username = 'emeline';" | xargs)
TEST_DATA=$(docker compose -f docker-compose.dev.yml exec -T db psql -U budget_user -d budget_db -tc "SELECT COUNT(*) FROM child_monthly_budgets WHERE user_id = $EMELINE_ID;")
if [ "$TEST_DATA" -ge 2 ]; then
    success "Test data verified ($(echo $TEST_DATA | xargs) records)"
else
    error "Test data not found"
fi

# Test backend API
progress "Testing backend health check..."
sleep 5  # Give backend time to fully start
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)
if [ "$HEALTH" = "200" ]; then
    success "Backend API is responding (HTTP $HEALTH)"
else
    error "Backend API not responding (HTTP $HEALTH)"
    exit 1
fi

# Show test data details
progress "Test data details:"
echo ""
docker compose -f docker-compose.dev.yml exec -T db psql -U budget_user -d budget_db -c "SELECT user_id, year, month, budget_amount FROM child_monthly_budgets WHERE user_id IN (SELECT id FROM users WHERE username = 'emeline') ORDER BY year, month;" || true
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  → Navigate to: ${BLUE}Dashboard → Budget Emeline${NC}"
echo ""
echo -e "Backend: ${BLUE}http://localhost:8000${NC}"
echo -e "  → API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "Test the following:"
echo -e "  1. Go to ${BLUE}http://localhost:3000/dashboard/emeline-budget${NC}"
echo -e "  2. Select ${BLUE}December 2025${NC} → Should show budget: 50€"
echo -e "  3. Select ${BLUE}January 2026${NC} → Should show budget: 40€"
echo ""
echo -e "To add test expenses:"
echo -e "  1. Click ${BLUE}Nouvelle dépense${NC}"
echo -e "  2. Add description, amount, and date"
echo -e "  3. Check that budget calculation updates correctly"
echo ""
echo -e "To stop services: ${YELLOW}docker compose -f docker-compose.dev.yml down${NC}"
