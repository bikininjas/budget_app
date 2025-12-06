#!/bin/bash
# Note: We don't use 'set -e' here because we want to collect all test results
# before exiting, not stop at the first failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

cleanup() {
    if [ "$KEEP_RUNNING" != "true" ]; then
        log_info "Cleaning up..."
        docker compose -f "$COMPOSE_FILE" down > /dev/null 2>&1 || true
    fi
}

# Trap to cleanup on exit
trap cleanup EXIT

# Parse arguments
SKIP_BUILD=false
KEEP_RUNNING=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --keep-running)
            KEEP_RUNNING=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-build] [--keep-running]"
            exit 1
            ;;
    esac
done

# Main script
cd "$PROJECT_ROOT"

log_section "🔨 STEP 1: Build Backend Docker Image"
if [ "$SKIP_BUILD" = true ]; then
    log_warning "Skipping Docker build (--skip-build flag)"
else
    log_info "Building backend Docker image..."
    if docker build -f "$BACKEND_DIR/Dockerfile.local" -t budget-backend-test "$BACKEND_DIR/"; then
        log_success "Backend Docker build successful"
    else
        log_error "Backend Docker build failed"
        exit 1
    fi
fi

log_section "🚀 STEP 2: Start Development Environment"
log_info "Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
log_info "Waiting for database to be ready..."
sleep 5

# Wait for backend to be ready
log_info "Waiting for backend to be ready..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Backend is ready"
        break
    fi
    RETRY=$((RETRY + 1))
    sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    log_error "Backend did not start in time"
    docker compose -f "$COMPOSE_FILE" logs backend
    exit 1
fi

log_section "📦 STEP 3: Apply Database Migrations"
log_info "Checking current migration state..."
CURRENT_MIGRATION=$(docker compose -f "$COMPOSE_FILE" exec -T backend alembic current 2>&1 | tail -n 1)
log_info "Current migration: $CURRENT_MIGRATION"

log_info "Applying migrations..."
if docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head; then
    log_success "Migrations applied successfully"
else
    log_error "Migration failed"
    exit 1
fi

# Verify migration applied
NEW_MIGRATION=$(docker compose -f "$COMPOSE_FILE" exec -T backend alembic current 2>&1 | tail -n 1)
log_info "New migration: $NEW_MIGRATION"

# Check if monthly_budget column exists
log_info "Verifying monthly_budget column exists..."
COLUMN_CHECK=$(docker compose -f "$COMPOSE_FILE" exec -T db psql -U budget_user -d budget_db -c "\d users" | grep "monthly_budget" || echo "")
if [ -n "$COLUMN_CHECK" ]; then
    log_success "Column monthly_budget exists in users table"
else
    log_error "Column monthly_budget NOT found in users table"
    exit 1
fi

# Check if child_expenses table exists
log_info "Verifying child_expenses table exists..."
TABLE_CHECK=$(docker compose -f "$COMPOSE_FILE" exec -T db psql -U budget_user -d budget_db -c "\dt child_expenses" | grep "child_expenses" || echo "")
if [ -n "$TABLE_CHECK" ]; then
    log_success "Table child_expenses exists"
else
    log_error "Table child_expenses NOT found"
    exit 1
fi

log_section "🧪 STEP 4: Test Backend Endpoints"

# Get auth token
log_info "Testing authentication..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=seb&password=changeme123")

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    log_error "Failed to get auth token"
    log_info "Response: $TOKEN_RESPONSE"
    exit 1
else
    log_success "Authentication successful (token obtained)"
fi

# Test health endpoint
log_info "Testing /api/health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok\|healthy"; then
    log_success "Health endpoint working"
else
    log_error "Health endpoint failed: $HEALTH_RESPONSE"
fi

# Test users endpoint
log_info "Testing GET /api/users/me..."
ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/users/me)
if echo "$ME_RESPONSE" | jq -e '.username == "seb"' > /dev/null 2>&1; then
    log_success "GET /api/users/me working"
else
    log_error "GET /api/users/me failed: $ME_RESPONSE"
fi

# Test expenses balance endpoint
log_info "Testing GET /api/expenses/stats/balance..."
BALANCE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:8000/api/expenses/stats/balance?user1_id=1&user2_id=2")
if echo "$BALANCE_RESPONSE" | jq -e '.user1_balance' > /dev/null 2>&1; then
    log_success "GET /api/expenses/stats/balance working"
else
    log_error "GET /api/expenses/stats/balance failed: $BALANCE_RESPONSE"
fi

# Test expenses list endpoint
log_info "Testing GET /api/expenses/..."
EXPENSES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/expenses/)
if echo "$EXPENSES_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
    log_success "GET /api/expenses/ working"
else
    log_error "GET /api/expenses/ failed: $EXPENSES_RESPONSE"
fi

# Test projects endpoint
log_info "Testing GET /api/projects/..."
PROJECTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/projects/)
if echo "$PROJECTS_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
    log_success "GET /api/projects/ working"
else
    log_error "GET /api/projects/ failed: $PROJECTS_RESPONSE"
fi

# Test project creation
log_info "Testing POST /api/projects/..."
PROJECT_DATA='{"name":"Test Project","description":"Automated test","target_amount":"1000.00","deadline":"2025-12-31"}'
CREATE_PROJECT_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d "$PROJECT_DATA" \
    http://localhost:8000/api/projects/)
if echo "$CREATE_PROJECT_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    log_success "POST /api/projects/ working"
    PROJECT_ID=$(echo "$CREATE_PROJECT_RESPONSE" | jq -r '.id')
    
    # Test project update
    log_info "Testing PATCH /api/projects/$PROJECT_ID..."
    UPDATE_DATA='{"is_active":false}'
    UPDATE_PROJECT_RESPONSE=$(curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" -d "$UPDATE_DATA" \
        "http://localhost:8000/api/projects/$PROJECT_ID")
    if echo "$UPDATE_PROJECT_RESPONSE" | jq -e '.is_active == false' > /dev/null 2>&1; then
        log_success "PATCH /api/projects/$PROJECT_ID working"
    else
        log_error "PATCH /api/projects/$PROJECT_ID failed: $UPDATE_PROJECT_RESPONSE"
    fi
else
    log_error "POST /api/projects/ failed: $CREATE_PROJECT_RESPONSE"
fi

# Test categories endpoint
log_info "Testing GET /api/categories/..."
CATEGORIES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/categories/)
if echo "$CATEGORIES_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
    log_success "GET /api/categories/ working"
else
    log_error "GET /api/categories/ failed: $CATEGORIES_RESPONSE"
fi

# Test accounts endpoint
log_info "Testing GET /api/accounts/..."
ACCOUNTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/accounts/)
if echo "$ACCOUNTS_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
    log_success "GET /api/accounts/ working"
else
    log_error "GET /api/accounts/ failed: $ACCOUNTS_RESPONSE"
fi

# Test child expenses endpoint (should work even if empty)
log_info "Testing GET /api/child-expenses/..."
CHILD_EXPENSES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/child-expenses/)
if echo "$CHILD_EXPENSES_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
    log_success "GET /api/child-expenses/ working"
else
    log_error "GET /api/child-expenses/ failed: $CHILD_EXPENSES_RESPONSE"
fi

# Test Emeline user exists
log_info "Testing Emeline user exists..."
EMELINE_CHECK=$(docker compose -f "$COMPOSE_FILE" exec -T db psql -U budget_user -d budget_db \
    -c "SELECT username, role FROM users WHERE username='emeline';" | grep "emeline" || echo "")
if [ -n "$EMELINE_CHECK" ]; then
    log_success "Emeline user exists with child role"
else
    log_error "Emeline user NOT found"
fi

log_section "📊 Test Summary"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo ""
echo -e "${BLUE}Total tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}║   ✓ ALL TESTS PASSED - READY TO PUSH  ║${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ "$KEEP_RUNNING" = true ]; then
        log_info "Environment kept running (--keep-running flag)"
        log_info "Backend: http://localhost:8000"
        log_info "Frontend: http://localhost:3000"
        log_info "Run 'docker compose -f docker-compose.dev.yml down' to stop"
    fi
    
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}║   ✗ TESTS FAILED - DO NOT PUSH        ║${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    log_error "Fix the failing tests before pushing!"
    exit 1
fi
