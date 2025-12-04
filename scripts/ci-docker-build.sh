#!/bin/bash
# Script de test CI local - Docker Build
# Reflète exactement les étapes du job docker-build de la CI GitHub Actions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."

echo "================================================"
echo "🐳 Docker Build (CI Simulation)"
echo "================================================"
echo ""

cd "$PROJECT_DIR"

# Vérifier que docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

echo "📦 Docker version: $(docker --version)"
echo ""

# Build Backend Image (comme dans la CI)
echo "🏗️  Building Backend Image..."
docker build \
    -t budget-backend:test \
    ./backend
echo "✅ Backend image built!"
echo ""

# Build Frontend Image (comme dans la CI)
echo "🏗️  Building Frontend Image..."
docker build \
    -t budget-frontend:test \
    ./frontend
echo "✅ Frontend image built!"
echo ""

echo "================================================"
echo "✅ Docker Build - SUCCESS"
echo "================================================"
echo ""
echo "Images créées:"
docker images | grep -E "budget-(backend|frontend)" | head -4
