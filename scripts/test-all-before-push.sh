#!/bin/bash
# Note: We don't use 'set -e' to collect all test results before exiting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $(printf '%-60s' "$1") ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Parse arguments
SKIP_BUILD=false
KEEP_RUNNING=false
TEST_BACKEND=true
TEST_FRONTEND=true

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
        --backend-only)
            TEST_FRONTEND=false
            shift
            ;;
        --frontend-only)
            TEST_BACKEND=false
            shift
            ;;
        *)
            echo "Usage: $0 [--skip-build] [--keep-running] [--backend-only] [--frontend-only]"
            echo ""
            echo "Options:"
            echo "  --skip-build      Skip Docker builds (faster, use if images already built)"
            echo "  --keep-running    Keep containers running after tests (for debugging)"
            echo "  --backend-only    Only test backend"
            echo "  --frontend-only   Only test frontend"
            exit 1
            ;;
    esac
done

OVERALL_SUCCESS=true

log_section "🚀 COMPLETE PRE-PUSH TEST SUITE"

if [ "$TEST_BACKEND" = true ]; then
    log_info "Starting backend tests..."
    
    BACKEND_ARGS=""
    [ "$SKIP_BUILD" = true ] && BACKEND_ARGS="$BACKEND_ARGS --skip-build"
    [ "$KEEP_RUNNING" = true ] && BACKEND_ARGS="$BACKEND_ARGS --keep-running"
    
    if "$SCRIPT_DIR/test-backend-before-push.sh" $BACKEND_ARGS; then
        log_success "Backend tests passed"
    else
        log_error "Backend tests failed"
        OVERALL_SUCCESS=false
    fi
fi

if [ "$TEST_FRONTEND" = true ]; then
    log_info "Starting frontend tests..."
    
    FRONTEND_ARGS=""
    [ "$SKIP_BUILD" = true ] && FRONTEND_ARGS="$FRONTEND_ARGS --skip-build"
    
    if "$SCRIPT_DIR/test-frontend-before-push.sh" $FRONTEND_ARGS; then
        log_success "Frontend tests passed"
    else
        log_error "Frontend tests failed"
        OVERALL_SUCCESS=false
    fi
fi

echo ""
log_section "🎯 FINAL RESULT"

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ████████╗███████╗███████╗████████╗███████╗                 ║
    ║   ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██╔════╝                 ║
    ║      ██║   █████╗  ███████╗   ██║   ███████╗                 ║
    ║      ██║   ██╔══╝  ╚════██║   ██║   ╚════██║                 ║
    ║      ██║   ███████╗███████║   ██║   ███████║                 ║
    ║      ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚══════╝                 ║
    ║                                                               ║
    ║         ██████╗  █████╗ ███████╗███████╗███████╗██████╗      ║
    ║         ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗     ║
    ║         ██████╔╝███████║███████╗███████╗█████╗  ██║  ██║     ║
    ║         ██╔═══╝ ██╔══██║╚════██║╚════██║██╔══╝  ██║  ██║     ║
    ║         ██║     ██║  ██║███████║███████║███████╗██████╔╝     ║
    ║         ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═════╝      ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}✓ All tests passed - You can safely push your code!${NC}"
    echo ""
    
    if [ "$KEEP_RUNNING" = true ]; then
        echo -e "${YELLOW}Environment kept running for debugging:${NC}"
        echo "  Backend:  http://localhost:8000"
        echo "  Frontend: http://localhost:3000"
        echo ""
        echo "Run 'docker compose -f docker-compose.dev.yml down' to stop"
    fi
    
    exit 0
else
    echo -e "${RED}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ████████╗███████╗███████╗████████╗███████╗                 ║
    ║   ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██╔════╝                 ║
    ║      ██║   █████╗  ███████╗   ██║   ███████╗                 ║
    ║      ██║   ██╔══╝  ╚════██║   ██║   ╚════██║                 ║
    ║      ██║   ███████╗███████║   ██║   ███████║                 ║
    ║      ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚══════╝                 ║
    ║                                                               ║
    ║         ███████╗ █████╗ ██╗██╗     ███████╗██████╗           ║
    ║         ██╔════╝██╔══██╗██║██║     ██╔════╝██╔══██╗          ║
    ║         █████╗  ███████║██║██║     █████╗  ██║  ██║          ║
    ║         ██╔══╝  ██╔══██║██║██║     ██╔══╝  ██║  ██║          ║
    ║         ██║     ██║  ██║██║███████╗███████╗██████╔╝          ║
    ║         ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝           ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo ""
    echo -e "${RED}✗ Some tests failed - DO NOT PUSH until you fix them!${NC}"
    echo ""
    exit 1
fi
