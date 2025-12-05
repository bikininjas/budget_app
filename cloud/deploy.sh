#!/bin/bash
# =============================================================================
# Script de déploiement Cloud Run - Budget App
# =============================================================================
# Usage: ./cloud/deploy.sh [backend|frontend|all]
# 
# Prérequis:
#   - gcloud CLI installé et configuré
#   - Secrets créés dans Secret Manager (voir setup-secrets.sh)
# =============================================================================

set -e

# Configuration
PROJECT_ID="sebsandbbox"
REGION="europe-west1"
BACKEND_SERVICE="budget-backend"
FRONTEND_SERVICE="budget-frontend"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Vérifier que gcloud est installé
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI n'est pas installé."
        echo "Installation: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
}

# Vérifier l'authentification
check_auth() {
    if ! gcloud auth print-access-token &> /dev/null; then
        log_warn "Non authentifié. Lancement de l'authentification..."
        gcloud auth login
    fi
    gcloud config set project $PROJECT_ID
}

# Activer les APIs nécessaires
enable_apis() {
    log_info "Activation des APIs nécessaires..."
    gcloud services enable \
        run.googleapis.com \
        cloudbuild.googleapis.com \
        secretmanager.googleapis.com \
        artifactregistry.googleapis.com
}

# Créer le repository Artifact Registry s'il n'existe pas
setup_artifact_registry() {
    log_info "Configuration d'Artifact Registry..."
    if ! gcloud artifacts repositories describe budget-app --location=$REGION &> /dev/null; then
        gcloud artifacts repositories create budget-app \
            --repository-format=docker \
            --location=$REGION \
            --description="Budget App Docker images"
    fi
}

# Déployer le backend
deploy_backend() {
    log_info "Déploiement du backend..."
    
    cd "$(dirname "$0")/.."
    
    # Build et push l'image
    IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/budget-app/$BACKEND_SERVICE:latest"
    
    log_info "Build de l'image backend..."
    gcloud builds submit ./backend \
        --tag "$IMAGE" \
        --dockerfile ./cloud/backend.dockerfile
    
    # Déployer sur Cloud Run avec les secrets
    log_info "Déploiement sur Cloud Run..."
    gcloud run deploy $BACKEND_SERVICE \
        --image "$IMAGE" \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 2 \
        --concurrency 80 \
        --timeout 300 \
        --set-secrets="DATABASE_URL=budget-database-url:latest,SECRET_KEY=budget-secret-key:latest" \
        --set-env-vars="CORS_ORIGINS=*"
    
    # Récupérer l'URL du backend
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
    log_info "Backend déployé sur: $BACKEND_URL"
    echo "$BACKEND_URL" > /tmp/backend_url.txt
}

# Déployer le frontend
deploy_frontend() {
    log_info "Déploiement du frontend..."
    
    cd "$(dirname "$0")/.."
    
    # Récupérer l'URL du backend
    if [ -f /tmp/backend_url.txt ]; then
        BACKEND_URL=$(cat /tmp/backend_url.txt)
    else
        BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)' 2>/dev/null || echo "")
    fi
    
    if [ -z "$BACKEND_URL" ]; then
        log_error "URL du backend non trouvée. Déployez d'abord le backend."
        exit 1
    fi
    
    log_info "Backend URL: $BACKEND_URL"
    
    # Build et push l'image
    IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/budget-app/$FRONTEND_SERVICE:latest"
    
    log_info "Build de l'image frontend..."
    gcloud builds submit ./frontend \
        --tag "$IMAGE" \
        --dockerfile ./cloud/frontend.dockerfile \
        --substitutions="_NEXT_PUBLIC_API_URL=$BACKEND_URL"
    
    # Déployer sur Cloud Run
    log_info "Déploiement sur Cloud Run..."
    gcloud run deploy $FRONTEND_SERVICE \
        --image "$IMAGE" \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 256Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 2 \
        --concurrency 80 \
        --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"
    
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')
    log_info "Frontend déployé sur: $FRONTEND_URL"
}

# Mettre à jour CORS du backend avec l'URL du frontend
update_cors() {
    log_info "Mise à jour des CORS..."
    
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)' 2>/dev/null || echo "")
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)' 2>/dev/null || echo "")
    
    if [ -n "$FRONTEND_URL" ] && [ -n "$BACKEND_URL" ]; then
        gcloud run services update $BACKEND_SERVICE \
            --region $REGION \
            --set-env-vars="CORS_ORIGINS=$FRONTEND_URL,http://localhost:3001,http://localhost:3000"
        log_info "CORS mis à jour pour accepter: $FRONTEND_URL"
    fi
}

# Exécuter les migrations Alembic
run_migrations() {
    log_info "Exécution des migrations..."
    
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
    
    # Les migrations doivent être exécutées localement avec la DATABASE_URL de Neon
    log_warn "Pour exécuter les migrations, utilisez:"
    echo ""
    echo "  export DATABASE_URL=\$(gcloud secrets versions access latest --secret=budget-database-url)"
    echo "  cd backend && alembic upgrade head"
    echo ""
}

# Main
main() {
    check_gcloud
    check_auth
    enable_apis
    setup_artifact_registry
    
    case "${1:-all}" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            deploy_frontend
            update_cors
            run_migrations
            ;;
        *)
            echo "Usage: $0 [backend|frontend|all]"
            exit 1
            ;;
    esac
    
    log_info "Déploiement terminé!"
}

main "$@"
