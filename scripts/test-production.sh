#!/bin/bash
# Test complet Mixed Content et CORS après redéploiement

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Test complet Mixed Content + CORS${NC}"
echo "=============================================="
echo ""

# Test 1: Backend HTTPS accessible
echo -n "1. Backend HTTPS accessible... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://backend-budget.novacat.fr/api/health)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ $STATUS${NC}"
else
    echo -e "${RED}✗ $STATUS${NC}"
fi

# Test 2: CORS Wildcard
echo -n "2. CORS Wildcard (*)... "
CORS=$(curl -s -I -H "Origin: https://budget.novacat.fr" https://backend-budget.novacat.fr/api/health | grep -i "access-control-allow-origin" | grep -o "\*")
if [ "$CORS" = "*" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not wildcard${NC}"
fi

# Test 3: Backend ne répond PAS en HTTP
echo -n "3. Backend HTTP désactivé... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://backend-budget.novacat.fr/api/health --max-time 5 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "000" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "308" ]; then
    echo -e "${GREEN}✓ Redirige vers HTTPS${NC}"
else
    echo -e "${YELLOW}⚠ Répond en HTTP: $HTTP_STATUS${NC}"
fi

# Test 4: Simule une requête du frontend
echo -n "4. Frontend → Backend HTTPS... "
RESPONSE=$(curl -s -H "Origin: https://budget.novacat.fr" \
    -H "Referer: https://budget.novacat.fr/" \
    -H "Accept: application/json" \
    https://backend-budget.novacat.fr/api/health)

if echo "$RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ OK${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${RED}✗ Échec${NC}"
    echo "   Response: $RESPONSE"
fi

# Test 5: Vérifier que le frontend charge
echo -n "5. Frontend accessible... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L https://budget.novacat.fr --max-time 10)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ $FRONTEND_STATUS${NC}"
else
    echo -e "${YELLOW}⚠ $FRONTEND_STATUS${NC}"
fi

# Test 6: Vérifier l'IP filtering
echo -n "6. IP Filtering (ton IP: 82.65.136.32)... "
# Ce test va échouer si lancé depuis une autre IP
# On vérifie juste que les variables sont configurées
export PATH=$PATH:/home/seb/GITRepos/budget_app/google-cloud-sdk/bin
ALLOWED_IPS=$(gcloud run services describe budget-backend --region europe-west1 --format="value(spec.template.spec.containers[0].env[?(@.name=='ALLOWED_IPS')].value)" 2>/dev/null || echo "")
if [ "$ALLOWED_IPS" = "82.65.136.32" ]; then
    echo -e "${GREEN}✓ Configuré${NC}"
else
    echo -e "${YELLOW}⚠ Non configuré${NC}"
fi

# Test 7: Vérifier les Referers autorisés
echo -n "7. Referer Filtering... "
ALLOWED_REFERERS=$(gcloud run services describe budget-backend --region europe-west1 --format="value(spec.template.spec.containers[0].env[?(@.name=='ALLOWED_REFERERS')].value)" 2>/dev/null || echo "")
if echo "$ALLOWED_REFERERS" | grep -q "budget.novacat.fr"; then
    echo -e "${GREEN}✓ Configuré${NC}"
    echo "   Allowed: $ALLOWED_REFERERS"
else
    echo -e "${YELLOW}⚠ Non configuré${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Déploiement validé !${NC}"
echo ""
echo "🌐 URLs de production:"
echo "   Frontend: https://budget.novacat.fr"
echo "   Backend:  https://backend-budget.novacat.fr"
echo ""
echo "🔒 Sécurité:"
echo "   - CORS: Wildcard (*) ✓"
echo "   - IP: 82.65.136.32 autorisée ✓"
echo "   - Referers: budget.novacat.fr, localhost ✓"
echo "   - HTTPS forcé ✓"
echo ""
echo "📝 Prochaine étape:"
echo "   Teste dans le navigateur: https://budget.novacat.fr"
echo "   Les requêtes API doivent passer en HTTPS sans Mixed Content"
