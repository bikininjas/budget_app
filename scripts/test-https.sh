#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Budget App - HTTPS & Mixed Content Diagnostic${NC}"
echo ""

FRONTEND_URL="https://budget.novacat.fr"
BACKEND_URL="https://backend-budget.novacat.fr"

echo -e "${YELLOW}Testing Frontend...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Frontend is up ($FRONTEND_STATUS)${NC}"
else
  echo -e "${RED}❌ Frontend returned $FRONTEND_STATUS${NC}"
fi

# Check HTTPS redirect
HTTP_FRONTEND="http://budget.novacat.fr"
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L "$HTTP_FRONTEND" | head -1)
echo -e "   HTTP→HTTPS redirect: $HTTP_REDIRECT"

echo ""
echo -e "${YELLOW}Testing Backend...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BACKEND_URL/api/health")
if [ "$BACKEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Backend is up ($BACKEND_STATUS)${NC}"
else
  echo -e "${RED}❌ Backend returned $BACKEND_STATUS${NC}"
fi

# Check backend debug endpoint
echo ""
echo -e "${YELLOW}Backend Debug Info:${NC}"
curl -s "$BACKEND_URL/api/debug/config" | jq '.'

echo ""
echo -e "${YELLOW}Security Headers Check:${NC}"
curl -s -I "$BACKEND_URL/api/health" | grep -E "(strict-transport-security|content-security-policy|x-forwarded-proto)" -i

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🌐 Open these URLs in your browser:${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}      $FRONTEND_URL"
echo -e "  ${GREEN}Debug Page:${NC}    $FRONTEND_URL/debug"
echo -e "  ${GREEN}Backend Debug:${NC} $BACKEND_URL/api/debug/config"
echo ""
echo -e "${BLUE}📋 What to check:${NC}"
echo "  1. Open $FRONTEND_URL/debug in browser"
echo "  2. Check that ALL protocols are HTTPS (green ✅)"
echo "  3. Look at browser console (F12) for Mixed Content errors"
echo "  4. If still HTTP, clear browser cache (Ctrl+Shift+Del)"
echo ""
