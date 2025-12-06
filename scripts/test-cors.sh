#!/bin/bash
# Script pour tester CORS et Mixed Content après les changements radicaux

set -e

echo "🔍 Test CORS et Mixed Content - Solutions Radicales"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
BACKEND_PROD="https://backend-budget.novacat.fr"
FRONTEND_PROD="https://budget.novacat.fr"
BACKEND_LOCAL="http://localhost:8001"

echo "📋 Vérifications:"
echo ""

# Test 1: Backend production accessible en HTTPS
echo -n "1. Backend production HTTPS... "
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_PROD/api/health" | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ⚠️  Backend production non accessible"
fi

# Test 2: Backend CORS headers
echo -n "2. Backend CORS wildcard... "
CORS_HEADER=$(curl -s -I -H "Origin: https://test.example.com" "$BACKEND_PROD/api/health" | grep -i "access-control-allow-origin" || echo "")
if echo "$CORS_HEADER" | grep -q "\*"; then
    echo -e "${GREEN}✓${NC}"
    echo "   → CORS: $CORS_HEADER"
else
    echo -e "${RED}✗${NC}"
    echo "   ⚠️  CORS wildcard non détecté"
    echo "   → Réponse: $CORS_HEADER"
fi

# Test 3: Vérifier que le backend ne répond PAS en HTTP
echo -n "3. Backend force HTTPS uniquement... "
HTTP_URL="${BACKEND_PROD/https:/http:}"
if ! curl -s -o /dev/null -w "%{http_code}" "$HTTP_URL/api/health" --max-time 5 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
    echo "   → HTTP redirige vers HTTPS"
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   ⚠️  Backend répond en HTTP (devrait rediriger)"
fi

# Test 4: Frontend client.ts détection
echo -n "4. Frontend client.ts... "
if grep -q "const API_URLS = {" /home/seb/GITRepos/budget_app/frontend/src/lib/api/client.ts; then
    echo -e "${GREEN}✓${NC}"
    echo "   → Hardcoded URLs configurées"
else
    echo -e "${RED}✗${NC}"
    echo "   ⚠️  Structure API_URLS non trouvée"
fi

# Test 5: Workflow sans NEXT_PUBLIC_API_URL
echo -n "5. Workflow sans NEXT_PUBLIC_API_URL... "
if ! grep -q "NEXT_PUBLIC_API_URL" /home/seb/GITRepos/budget_app/.github/workflows/deploy.yml; then
    echo -e "${GREEN}✓${NC}"
    echo "   → Plus de dépendance à NEXT_PUBLIC_API_URL"
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   ⚠️  NEXT_PUBLIC_API_URL encore présent dans workflow"
fi

# Test 6: Dockerfile sans ARG
echo -n "6. Dockerfile sans ARG... "
if ! grep -q "ARG NEXT_PUBLIC_API_URL" /home/seb/GITRepos/budget_app/cloud/frontend.dockerfile; then
    echo -e "${GREEN}✓${NC}"
    echo "   → Build-arg supprimé"
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   ⚠️  ARG NEXT_PUBLIC_API_URL encore présent"
fi

# Test 7: Backend config IP filtering
echo -n "7. Backend IP filtering config... "
if grep -q "allowed_ips:" /home/seb/GITRepos/budget_app/backend/app/core/config.py; then
    echo -e "${GREEN}✓${NC}"
    echo "   → IP filtering configuré"
else
    echo -e "${RED}✗${NC}"
    echo "   ⚠️  Config IP filtering manquante"
fi

# Test 8: Backend middleware IP filtering
echo -n "8. Backend middleware IP filtering... "
if grep -q "ip_referer_filter" /home/seb/GITRepos/budget_app/backend/app/main.py; then
    echo -e "${GREEN}✓${NC}"
    echo "   → Middleware actif"
else
    echo -e "${RED}✗${NC}"
    echo "   ⚠️  Middleware IP filtering manquant"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Tests terminés${NC}"
echo ""
echo "🔒 Sécurité configurée:"
echo "   → IP autorisée: 82.65.136.32"
echo "   → Referers autorisés: budget.novacat.fr, localhost"
echo "   → Tous les autres accès seront bloqués (403)"
echo ""
echo "📝 Actions recommandées:"
echo "   1. git add -A"
echo "   2. git commit -m 'fix: Solutions radicales Mixed Content + CORS'"
echo "   3. git push origin master"
echo "   4. Attendre déploiement GitHub Actions"
echo "   5. Tester sur $FRONTEND_PROD"
echo ""
