#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   FIX PRODUCTION 500 ERROR - APPLY MIGRATION 005              ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${RED}PROBLÈME:${NC}"
echo "  - Erreur 500 sur /api/auth/login en production"
echo "  - Cause: Migration 005 pas appliquée sur base Neon"
echo "  - La colonne 'monthly_budget' manque dans la table 'users'"
echo ""

echo -e "${GREEN}SOLUTION RAPIDE:${NC}"
echo ""
echo "1. Récupère ta DATABASE_URL de Neon.tech:"
echo "   • Va sur https://console.neon.tech/"
echo "   • Sélectionne ton projet 'budget_app'"
echo "   • Va dans 'Connection Details'"
echo "   • Copie la connection string complète"
echo "   • Format: postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"
echo ""

echo "2. Execute les commandes suivantes:"
echo ""
echo -e "${BLUE}   cd backend${NC}"
echo -e "${BLUE}   export DATABASE_URL='<colle-ton-url-neon-ici>'${NC}"
echo -e "${BLUE}   alembic current${NC}  # Vérifie l'état actuel"
echo -e "${BLUE}   alembic upgrade head${NC}  # Applique les migrations"
echo ""

echo "3. Vérifie que ça fonctionne:"
echo -e "${BLUE}   curl https://backend-budget.novacat.fr/api/health${NC}"
echo -e "${BLUE}   curl -X POST https://backend-budget.novacat.fr/api/auth/login \\${NC}"
echo -e "${BLUE}     -H 'Content-Type: application/x-www-form-urlencoded' \\${NC}"
echo -e "${BLUE}     -d 'username=seb&password=changeme123'${NC}"
echo ""

echo -e "${YELLOW}ALTERNATIVE - Si tu n'as pas accès à Neon:${NC}"
echo ""
echo "1. Redéploie via GitHub Actions:"
echo "   • Va sur https://github.com/bikininjas/budget_app/actions"
echo "   • Clique sur 'Deploy to Cloud Run'"
echo "   • Run workflow sur master"
echo "   • Sélectionne 'Deploy Backend'"
echo ""
echo "2. Puis applique la migration manuellement via Cloud Run:"
echo "   • Ouvre Cloud Console"
echo "   • Trouve le service 'backend-budget'"
echo "   • Cloud Shell > Connect to service"
echo "   • Execute: alembic upgrade head"
echo ""

echo -e "${RED}NOTE IMPORTANTE:${NC}"
echo "  La migration 005 a été corrigée pour gérer les enum existants."
echo "  Elle devrait s'appliquer sans problème maintenant."
echo ""
