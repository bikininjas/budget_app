#!/bin/bash
# Note: We don't use 'set -e' to collect all test results before exiting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

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

# Parse arguments
SKIP_BUILD=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-build]"
            exit 1
            ;;
    esac
done

cd "$FRONTEND_DIR"

log_section "🎨 FRONTEND PRE-PUSH TESTS"

log_section "📦 STEP 1: Install Dependencies"
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    if bun install; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
else
    log_info "Dependencies already installed"
fi

log_section "🔍 STEP 2: TypeScript Type Checking"
log_info "Running TypeScript compiler..."
if bun run build --dry-run 2>&1 | grep -q "Compiled successfully\|Build completed"; then
    log_success "TypeScript types are valid"
else
    log_info "Running tsc for detailed errors..."
    if bunx tsc --noEmit; then
        log_success "TypeScript check passed"
    else
        log_error "TypeScript type errors found"
    fi
fi

log_section "🧹 STEP 3: ESLint"
log_info "Running ESLint..."
if bun run lint; then
    log_success "ESLint passed - no linting errors"
else
    log_error "ESLint failed - fix linting errors"
fi

log_section "🔨 STEP 4: Build Docker Image"
if [ "$SKIP_BUILD" = true ]; then
    log_warning "Skipping Docker build (--skip-build flag)"
else
    log_info "Building frontend Docker image..."
    cd "$PROJECT_ROOT"
    if docker build -f "$FRONTEND_DIR/Dockerfile.local" -t budget-frontend-test "$FRONTEND_DIR/"; then
        log_success "Frontend Docker build successful"
    else
        log_error "Frontend Docker build failed"
        exit 1
    fi
fi

log_section "📊 Test Summary"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo ""
echo -e "${BLUE}Total checks:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}║   ✓ FRONTEND READY TO PUSH            ║${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}║   ✗ FRONTEND TESTS FAILED             ║${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    exit 1
fi
