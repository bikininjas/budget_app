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
echo "║                                                                ║"
echo "║   PRODUCTION DATABASE MIGRATION                                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

log_warning "⚠️  This script will connect to the PRODUCTION Neon database"
log_warning "⚠️  and run 'alembic upgrade head' to apply pending migrations"
echo ""

# The DATABASE_URL from GitHub secrets (Neon production)
# This is stored in the secret manager, we need it from the deployed service
log_info "To run migrations in production, we have two options:"
echo ""
echo "1. Use GitHub Actions workflow (RECOMMENDED)"
echo "   - Go to: https://github.com/bikininjas/budget_app/actions"
echo "   - Select 'Deploy to Cloud Run' workflow"
echo "   - Click 'Run workflow'"
echo "   - Check 'Run database migrations' checkbox"
echo "   - This will deploy AND run migrations safely"
echo ""
echo "2. Manual SSH into a backend container instance (ADVANCED)"
echo "   - Use Cloud Shell or gcloud"
echo "   - Connect to backend service"
echo "   - Run 'alembic upgrade head'"
echo ""

read -p "Do you want to trigger a GitHub Actions deployment with migrations? (yes/no): " TRIGGER

if [ "$TRIGGER" = "yes" ]; then
    log_info "Opening GitHub Actions in browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://github.com/bikininjas/budget_app/actions/workflows/deploy.yml"
    elif command -v open &> /dev/null; then
        open "https://github.com/bikininjas/budget_app/actions/workflows/deploy.yml"
    else
        log_info "Please visit: https://github.com/bikininjas/budget_app/actions/workflows/deploy.yml"
    fi
    echo ""
    log_info "Steps:"
    log_info "1. Click 'Run workflow' button"
    log_info "2. Select 'master' branch"
    log_info "3. Check both 'Deploy Backend' and 'Deploy Frontend'"
    log_info "4. Check 'Run database migrations' (if available)"
    log_info "5. Click 'Run workflow'"
    echo ""
    log_info "The workflow will rebuild and redeploy with migrations applied"
else
    log_info "No action taken. To run migrations manually:"
    echo ""
    echo "Using Neon database directly (requires DATABASE_URL):"
    echo "  cd backend"
    echo "  export DATABASE_URL='<neon-connection-string>'"
    echo "  alembic upgrade head"
    echo ""
    log_warning "Note: You need the DATABASE_URL from GCP Secret Manager"
fi
