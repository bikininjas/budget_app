#!/bin/bash
# Script de test CI local - Backend Lint
# Reflète exactement les étapes du job backend-lint de la CI GitHub Actions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

echo "================================================"
echo "🔍 Backend Lint (CI Simulation)"
echo "================================================"
echo ""

cd "$BACKEND_DIR"

# Activer le venv si disponible
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Vérifier que ruff est installé
if ! command -v ruff &> /dev/null; then
    echo "❌ ruff n'est pas installé. Installez-le avec: pip install ruff"
    exit 1
fi

echo "📦 Ruff version: $(ruff --version)"
echo ""

# Run Ruff linter (comme dans la CI)
echo "🔍 Running Ruff linter..."
ruff check . --fix
echo "✅ Ruff linter passed!"
echo ""

# Run Ruff formatter check (comme dans la CI)
echo "🎨 Running Ruff formatter check..."
ruff format .
echo "✅ Ruff formatter check passed!"
echo ""

echo "================================================"
echo "✅ Backend Lint - SUCCESS"
echo "================================================"
