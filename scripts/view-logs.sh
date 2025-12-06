#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Budget App - Cloud Run Logs Viewer${NC}"
echo ""

# Service selection
echo -e "${YELLOW}Which service logs do you want to view?${NC}"
echo "1) Backend (budget-backend)"
echo "2) Frontend (budget-frontend)"
echo "3) Both (split view)"
read -p "Enter choice [1-3]: " choice

REGION="europe-west1"
PROJECT_ID="duobudget"

case $choice in
  1)
    echo -e "${GREEN}📊 Viewing Backend logs...${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop${NC}"
    echo ""
    gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=budget-backend AND resource.labels.location=$REGION" \
      --project=$PROJECT_ID \
      --format="table(timestamp,severity,textPayload,jsonPayload.message)" \
      --log-filter='severity>=INFO'
    ;;
  2)
    echo -e "${GREEN}📊 Viewing Frontend logs...${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop${NC}"
    echo ""
    gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=budget-frontend AND resource.labels.location=$REGION" \
      --project=$PROJECT_ID \
      --format="table(timestamp,severity,textPayload,jsonPayload.message)" \
      --log-filter='severity>=INFO'
    ;;
  3)
    echo -e "${GREEN}📊 Viewing Both services logs...${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop${NC}"
    echo ""
    gcloud logging tail "resource.type=cloud_run_revision AND (resource.labels.service_name=budget-backend OR resource.labels.service_name=budget-frontend) AND resource.labels.location=$REGION" \
      --project=$PROJECT_ID \
      --format="table(timestamp,resource.labels.service_name,severity,textPayload,jsonPayload.message)" \
      --log-filter='severity>=INFO'
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac
