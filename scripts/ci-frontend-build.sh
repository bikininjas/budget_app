#!/bin/bash
# Script de test CI local - Frontend Build
# Reflète exactement les étapes du job frontend-build de la CI GitHub Actions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "================================================"
echo "🏗️  Frontend Build (CI Simulation)"
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

# Variables d'environnement (comme dans la CI)
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8000}"

echo "📦 Configuration:"
echo "   NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
echo ""

# Installer les dépendances (comme dans la CI)
echo "📦 Installation des dépendances..."
bun install
echo ""

# Build (comme dans la CI)
echo "🏗️  Building..."
bun run build
echo "✅ Build completed!"
echo ""

echo "================================================"
echo "✅ Frontend Build - SUCCESS"
echo "================================================"
