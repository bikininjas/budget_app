#!/bin/bash
# Script pour reconfigurer les domaines custom après redéploiement

set -e

export PATH=$PATH:/home/seb/GITRepos/budget_app/google-cloud-sdk/bin

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Reconfiguration des domaines custom${NC}"
echo "=============================================="
echo ""

# Backend custom domain
echo "Backend: backend-budget.novacat.fr"
echo "→ Mappé vers: budget-backend (Cloud Run)"
echo ""

# Check if backend is deployed
BACKEND_STATUS=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(status.conditions[0].status)' 2>/dev/null || echo "NOT_FOUND")

if [ "$BACKEND_STATUS" != "True" ]; then
    echo -e "${RED}❌ Backend pas encore déployé. Attends le déploiement GitHub Actions.${NC}"
    exit 1
fi

# Get backend URL
BACKEND_URL=$(gcloud run services describe budget-backend --region europe-west1 --format 'value(status.url)')
echo -e "${GREEN}✓ Backend déployé: $BACKEND_URL${NC}"
echo ""

# Map custom domain
echo "Mapping du domaine custom..."
echo ""
echo "Commandes à exécuter (si pas déjà fait):"
echo ""
echo -e "${YELLOW}# 1. Mapper le domaine backend${NC}"
echo "gcloud run domain-mappings create --service=budget-backend --domain=backend-budget.novacat.fr --region=europe-west1"
echo ""
echo -e "${YELLOW}# 2. Mapper le domaine frontend${NC}"
echo "gcloud run domain-mappings create --service=budget-frontend --domain=budget.novacat.fr --region=europe-west1"
echo ""
echo -e "${YELLOW}# 3. Vérifier les mappings${NC}"
echo "gcloud run domain-mappings list --region=europe-west1"
echo ""
echo "=============================================="
echo -e "${BLUE}📋 DNS à vérifier:${NC}"
echo "backend-budget.novacat.fr → CNAME vers ghs.googlehosted.com"
echo "budget.novacat.fr → CNAME vers ghs.googlehosted.com"
echo ""
echo "Note: Les domaines custom devraient déjà être configurés."
echo "Cloud Run les réassociera automatiquement aux nouveaux services."
