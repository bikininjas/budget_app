#!/bin/bash
# Script pour vérifier le statut du déploiement Cloud Run

set -e

export PATH=$PATH:/home/seb/GITRepos/budget_app/google-cloud-sdk/bin

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Vérification du déploiement Cloud Run${NC}"
echo "=============================================="
echo ""

# Check backend
echo -n "Backend (budget-backend)... "
BACKEND_STATUS=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(status.conditions[0].status)' 2>/dev/null || echo "NOT_FOUND")

if [ "$BACKEND_STATUS" = "True" ]; then
    BACKEND_URL=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(status.url)')
    echo -e "${GREEN}✓ Déployé${NC}"
    echo "   URL: $BACKEND_URL"
    
    # Check CORS
    echo -n "   CORS... "
    CORS=$(curl -s -I -H "Origin: https://test.example.com" "$BACKEND_URL/api/health" | grep -i "access-control-allow-origin" | head -1 || echo "")
    if echo "$CORS" | grep -q "\*"; then
        echo -e "${GREEN}✓ Wildcard${NC}"
    else
        echo -e "${YELLOW}⚠ Non wildcard${NC}"
    fi
    
    # Check env vars
    echo "   Variables d'environnement:"
    CORS_ORIGINS=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(spec.template.spec.containers[0].env[?(@.name=="CORS_ORIGINS")].value)' 2>/dev/null || echo "")
    ALLOWED_IPS=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(spec.template.spec.containers[0].env[?(@.name=="ALLOWED_IPS")].value)' 2>/dev/null || echo "")
    ALLOWED_REFERERS=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(spec.template.spec.containers[0].env[?(@.name=="ALLOWED_REFERERS")].value)' 2>/dev/null || echo "")
    
    echo "      CORS_ORIGINS: ${CORS_ORIGINS:-❌ Non configuré}"
    echo "      ALLOWED_IPS: ${ALLOWED_IPS:-❌ Non configuré}"
    echo "      ALLOWED_REFERERS: ${ALLOWED_REFERERS:-❌ Non configuré}"
    
elif [ "$BACKEND_STATUS" = "NOT_FOUND" ]; then
    echo -e "${YELLOW}⏳ En cours de déploiement...${NC}"
else
    echo -e "${RED}✗ Erreur${NC}"
fi

echo ""

# Check frontend
echo -n "Frontend (budget-frontend)... "
FRONTEND_STATUS=$(gcloud run services describe budget-frontend --region europe-west1 --format 'value(status.conditions[0].status)' 2>/dev/null || echo "NOT_FOUND")

if [ "$FRONTEND_STATUS" = "True" ]; then
    FRONTEND_URL=$(gcloud run services describe budget-frontend --region europe-west1 --format 'value(status.url)')
    echo -e "${GREEN}✓ Déployé${NC}"
    echo "   URL: $FRONTEND_URL"
elif [ "$FRONTEND_STATUS" = "NOT_FOUND" ]; then
    echo -e "${YELLOW}⏳ En cours de déploiement...${NC}"
else
    echo -e "${RED}✗ Erreur${NC}"
fi

echo ""
echo "=============================================="
echo -e "${BLUE}📋 Actions à faire:${NC}"
echo "1. Attendre que les deux services soient déployés"
echo "2. Configurer le domaine custom: https://backend-budget.novacat.fr"
echo "3. Tester sur: https://budget.novacat.fr"
echo ""
echo "GitHub Actions: https://github.com/bikininjas/budget_app/actions"
