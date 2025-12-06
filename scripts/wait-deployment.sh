#!/bin/bash
# Attendre et vérifier le nouveau déploiement frontend

set -e

export PATH=$PATH:/home/seb/GITRepos/budget_app/google-cloud-sdk/bin

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}⏳ Attente du nouveau déploiement...${NC}"
echo "=============================================="
echo ""

# Function to check frontend revision
check_frontend() {
    local revision=$(gcloud run services describe budget-frontend --region europe-west1 --format='value(status.latestCreatedRevisionName)' 2>/dev/null || echo "")
    echo "$revision"
}

# Get initial revision
INITIAL_REV=$(check_frontend)
echo "Revision actuelle: $INITIAL_REV"
echo ""
echo "En attente du nouveau build (peut prendre 5-10 minutes)..."
echo "GitHub Actions: https://github.com/bikininjas/budget_app/actions"
echo ""

# Wait for new revision
MAX_WAIT=600  # 10 minutes
ELAPSED=0
INTERVAL=30

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    
    CURRENT_REV=$(check_frontend)
    
    if [ "$CURRENT_REV" != "$INITIAL_REV" ] && [ -n "$CURRENT_REV" ]; then
        echo -e "${GREEN}✓ Nouveau déploiement détecté !${NC}"
        echo "Nouvelle revision: $CURRENT_REV"
        echo ""
        break
    fi
    
    echo "⏳ Toujours en cours... (${ELAPSED}s / ${MAX_WAIT}s)"
done

if [ "$CURRENT_REV" = "$INITIAL_REV" ]; then
    echo -e "${YELLOW}⚠ Timeout: Aucun nouveau déploiement détecté${NC}"
    echo "Vérifie GitHub Actions manuellement"
    exit 1
fi

# Wait a bit more for DNS propagation
echo "⏳ Attente propagation (30s)..."
sleep 30

# Test the new deployment
echo ""
echo "🧪 Test du nouveau déploiement..."
echo ""

# Test 1: Frontend accessible
echo -n "1. Frontend accessible... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L https://budget.novacat.fr --max-time 10)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ $STATUS${NC}"
else
    echo -e "${RED}✗ $STATUS${NC}"
fi

# Test 2: Backend HTTPS
echo -n "2. Backend HTTPS accessible... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://backend-budget.novacat.fr/api/health)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ $STATUS${NC}"
else
    echo -e "${RED}✗ $STATUS${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "📝 Actions à faire:"
echo ""
echo "1. ${YELLOW}Vider le cache du navigateur${NC}:"
echo "   - Chrome: Ctrl+Shift+Delete → Tout supprimer"
echo "   - Firefox: Ctrl+Shift+Delete → Tout supprimer"
echo "   - Ou navigation privée: Ctrl+Shift+N (Chrome) / Ctrl+Shift+P (Firefox)"
echo ""
echo "2. ${YELLOW}Recharger la page${NC}:"
echo "   - Aller sur https://budget.novacat.fr"
echo "   - Recharger avec Ctrl+Shift+R (hard reload)"
echo ""
echo "3. ${YELLOW}Vérifier la console${NC}:"
echo "   - F12 pour ouvrir DevTools"
echo "   - Onglet Console"
echo "   - Plus d'erreurs Mixed Content !"
echo ""
echo "4. ${YELLOW}Vérifier les requêtes${NC}:"
echo "   - F12 → Onglet Network"
echo "   - Filtrer: XHR"
echo "   - Toutes les requêtes doivent être en HTTPS"
echo ""
