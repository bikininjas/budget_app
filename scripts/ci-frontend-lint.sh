#!/bin/bash
# Script de test CI local - Frontend Lint
# Reflète exactement les étapes du job frontend-lint de la CI GitHub Actions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "================================================"
echo "🔍 Frontend Lint (CI Simulation)"
echo "================================================"
echo ""

cd "$FRONTEND_DIR"

# Vérifier que bun est installé
if ! command -v bun &> /dev/null; then
    echo "⚠️  bun n'est pas installé."
    echo "   Installation avec: npm install -g bun"
    echo "   Ou: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "📦 Bun version: $(bun --version)"
echo ""

# Installer les dépendances (comme dans la CI)
echo "📦 Installation des dépendances..."
bun install
echo ""

# Run ESLint (comme dans la CI)
echo "🔍 Running ESLint..."
bun lint
echo "✅ ESLint passed!"
echo ""

# Run TypeScript check (comme dans la CI)
echo "📝 Running TypeScript check..."
bun tsc --noEmit
echo "✅ TypeScript check passed!"
echo ""

echo "================================================"
echo "✅ Frontend Lint - SUCCESS"
echo "================================================"
