#!/bin/bash
# Script de test CI local - Backend Tests
# Reflète exactement les étapes du job backend-test de la CI GitHub Actions
# Nécessite PostgreSQL (via Docker ou installation locale)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
PROJECT_DIR="$SCRIPT_DIR/.."

echo "================================================"
echo "🧪 Backend Tests (CI Simulation)"
echo "================================================"
echo ""

cd "$BACKEND_DIR"

# Activer le venv si disponible
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Variables d'environnement (comme dans la CI)
export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://test_user:test_password@localhost:5432/test_db}"
export SECRET_KEY="${SECRET_KEY:-test-secret-key}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000}"

echo "📦 Configuration:"
echo "   DATABASE_URL: $DATABASE_URL"
echo "   SECRET_KEY: [hidden]"
echo "   CORS_ORIGINS: $CORS_ORIGINS"
echo ""

# Vérifier la connexion PostgreSQL
echo "🔍 Vérification de la connexion PostgreSQL..."
if ! pg_isready -h localhost -p 5432 -U test_user 2>/dev/null; then
    echo ""
    echo "⚠️  PostgreSQL n'est pas accessible sur localhost:5432"
    echo ""
    echo "Options pour démarrer PostgreSQL:"
    echo ""
    echo "1. Via Docker (recommandé):"
    echo "   docker run -d --name budget-test-db \\"
    echo "     -e POSTGRES_USER=test_user \\"
    echo "     -e POSTGRES_PASSWORD=test_password \\"
    echo "     -e POSTGRES_DB=test_db \\"
    echo "     -p 5432:5432 \\"
    echo "     postgres:16-alpine"
    echo ""
    echo "2. Ou utilisez le script complet:"
    echo "   ./scripts/ci-backend-test-with-docker.sh"
    echo ""
    exit 1
fi
echo "✅ PostgreSQL accessible"
echo ""

# Vérifier que pytest est installé
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest n'est pas installé. Installez-le avec: pip install -e '.[dev]'"
    exit 1
fi

echo "📦 Pytest version: $(pytest --version)"
echo ""

# Run tests with coverage (comme dans la CI)
echo "🧪 Running tests with coverage..."
pytest --cov=app --cov-report=xml --cov-report=term-missing

echo ""
echo "================================================"
echo "✅ Backend Tests - SUCCESS"
echo "================================================"
