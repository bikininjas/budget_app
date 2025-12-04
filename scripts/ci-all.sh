#!/bin/bash
# Script CI complet local
# Exécute tous les jobs de la CI dans l'ordre

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔══════════════════════════════════════════════════╗"
echo "║       🚀 CI Locale Complète - Budget App         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Fonction pour exécuter un script et capturer le résultat
run_step() {
    local name="$1"
    local script="$2"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$SCRIPT_DIR/$script"; then
        echo ""
        echo "✅ $name - PASSED"
    else
        echo ""
        echo "❌ $name - FAILED"
        exit 1
    fi
}

# Parse arguments
SKIP_DOCKER=false
SKIP_TESTS=false

for arg in "$@"; do
    case $arg in
        --skip-docker)
            SKIP_DOCKER=true
            ;;
        --skip-tests)
            SKIP_TESTS=true
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-docker  Skip Docker build step"
            echo "  --skip-tests   Skip backend tests (requires PostgreSQL)"
            echo "  --help         Show this help message"
            exit 0
            ;;
    esac
done

# Étapes parallélisables dans la CI (exécutées séquentiellement ici)
# Jobs: backend-lint, backend-test, frontend-lint, frontend-build

# 1. Backend Lint
run_step "Backend Lint" "ci-backend-lint.sh"

# 2. Backend Tests (optionnel)
if [ "$SKIP_TESTS" = false ]; then
    run_step "Backend Tests" "ci-backend-test-with-docker.sh"
else
    echo ""
    echo "⏭️  Backend Tests skipped (--skip-tests)"
fi

# 3. Frontend Lint
run_step "Frontend Lint" "ci-frontend-lint.sh"

# 4. Frontend Build
run_step "Frontend Build" "ci-frontend-build.sh"

# 5. Docker Build (dépend des 4 premiers jobs)
if [ "$SKIP_DOCKER" = false ]; then
    run_step "Docker Build" "ci-docker-build.sh"
else
    echo ""
    echo "⏭️  Docker Build skipped (--skip-docker)"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           ✅ CI COMPLÈTE - SUCCESS               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Tous les checks ont passé! 🎉"
