#!/bin/bash
# Affiche tous les scripts disponibles avec descriptions

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m'

echo -e "${BLUE}📋 Scripts DuoBudget disponibles${NC}"
echo "=================================="
echo ""

echo -e "${GREEN}🚀 Déploiement & Monitoring:${NC}"
echo "  check-deployment.sh      - Vérifie statut services Cloud Run"
echo "  wait-deployment.sh       - Attend fin déploiement + guide"
echo "  configure-domains.sh     - Mapper domaines custom"
echo ""

echo -e "${GREEN}🧪 Tests & Validation:${NC}"
echo "  test-production.sh       - Test end-to-end production (HTTPS, CORS)"
echo "  test-cors.sh            - Test configuration CORS et Mixed Content"
echo ""

echo -e "${GREEN}⚙️  CI/CD (local ou GitHub Actions):${NC}"
echo "  ci-all.sh               - Lance tous les tests CI"
echo "  ci-backend-lint.sh      - Linting backend (ruff)"
echo "  ci-backend-test.sh      - Tests backend (pytest)"
echo "  ci-backend-test-with-docker.sh - Tests backend avec Docker"
echo "  ci-frontend-lint.sh     - Linting frontend (ESLint + TS)"
echo "  ci-frontend-build.sh    - Build frontend validation"
echo "  ci-docker-build.sh      - Build images Docker"
echo ""

echo -e "${YELLOW}📦 Scripts archivés (obsolètes):${NC}"
echo "  archive/backup.sh       - Remplacé par .github/workflows/backup.yml"
echo "  archive/restore.sh      - Utiliser GCP Console"
echo "  archive/migrate-to-cloud.sh - Migration terminée"
echo ""

echo -e "${GRAY}💡 Usage courant:${NC}"
echo "  Après déploiement:    ./scripts/test-production.sh"
echo "  Avant commit:         ./scripts/ci-all.sh"
echo "  Problème CORS:        ./scripts/test-cors.sh"
echo "  Attendre deploy:      ./scripts/wait-deployment.sh"
echo ""
echo "  Documentation:        cat scripts/README.md"
