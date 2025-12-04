#!/bin/bash
# Script de test CI local - Backend Tests avec Docker PostgreSQL
# Démarre automatiquement un conteneur PostgreSQL pour les tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
CONTAINER_NAME="budget-test-db"

echo "================================================"
echo "🧪 Backend Tests avec Docker PostgreSQL"
echo "================================================"
echo ""

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🧹 Nettoyage..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
}

# Trap pour nettoyer en cas d'erreur ou d'interruption
trap cleanup EXIT

# Arrêter et supprimer le conteneur s'il existe déjà
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Démarrer PostgreSQL (comme dans la CI)
echo "🐘 Démarrage de PostgreSQL..."
docker run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER=test_user \
    -e POSTGRES_PASSWORD=test_password \
    -e POSTGRES_DB=test_db \
    -p 5432:5432 \
    --health-cmd "pg_isready" \
    --health-interval 10s \
    --health-timeout 5s \
    --health-retries 5 \
    postgres:16-alpine

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
for i in {1..30}; do
    if docker exec "$CONTAINER_NAME" pg_isready -U test_user 2>/dev/null; then
        echo "✅ PostgreSQL est prêt!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL n'a pas démarré à temps"
        exit 1
    fi
    sleep 1
done
echo ""

# Exécuter les tests
cd "$BACKEND_DIR"

# Activer le venv si disponible
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Variables d'environnement (comme dans la CI)
export DATABASE_URL="postgresql+asyncpg://test_user:test_password@localhost:5432/test_db"
export SECRET_KEY="test-secret-key"
export CORS_ORIGINS="http://localhost:3000"

echo "📦 Configuration:"
echo "   DATABASE_URL: $DATABASE_URL"
echo "   SECRET_KEY: [hidden]"
echo "   CORS_ORIGINS: $CORS_ORIGINS"
echo ""

# Run tests with coverage (comme dans la CI)
echo "🧪 Running tests with coverage..."
pytest --cov=app --cov-report=xml --cov-report=term-missing

echo ""
echo "================================================"
echo "✅ Backend Tests - SUCCESS"
echo "================================================"
