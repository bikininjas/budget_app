#!/bin/bash
# =============================================================================
# Configuration des secrets Google Cloud Secret Manager
# =============================================================================
# Usage: ./cloud/setup-secrets.sh
#
# Ce script crée les secrets nécessaires dans Google Cloud Secret Manager.
# Les valeurs sont demandées de manière interactive (jamais en clair dans le code).
# =============================================================================

set -e

PROJECT_ID="sebsandbbox"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Vérifier gcloud
if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI n'est pas installé."
    exit 1
fi

# Configuration du projet
gcloud config set project $PROJECT_ID

# Activer l'API Secret Manager
log_info "Activation de Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

echo ""
echo "=============================================="
echo "  Configuration des secrets pour Budget App"
echo "=============================================="
echo ""

# Fonction pour créer ou mettre à jour un secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    if gcloud secrets describe $SECRET_NAME &> /dev/null; then
        log_warn "Le secret '$SECRET_NAME' existe déjà. Mise à jour..."
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=-
    else
        log_info "Création du secret '$SECRET_NAME'..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=-
    fi
}

# 1. DATABASE_URL (Neon PostgreSQL)
log_step "Configuration de DATABASE_URL (Neon PostgreSQL)"
echo ""
echo "Tu dois d'abord créer un compte sur https://neon.tech (gratuit)"
echo "Puis créer un projet et récupérer la connection string."
echo ""
echo "Format attendu: postgresql+asyncpg://user:password@host/database?sslmode=require"
echo ""
read -sp "Colle ta DATABASE_URL Neon (entrée masquée): " DATABASE_URL
echo ""

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL ne peut pas être vide"
    exit 1
fi

create_or_update_secret "budget-database-url" "$DATABASE_URL"

# 2. SECRET_KEY (JWT)
log_step "Configuration de SECRET_KEY (pour JWT)"
echo ""
echo "Génération d'une clé secrète aléatoire..."
SECRET_KEY=$(openssl rand -hex 32)
echo "Clé générée (ne sera pas affichée en clair)"

create_or_update_secret "budget-secret-key" "$SECRET_KEY"

# 3. Donner accès au service Cloud Run
log_info "Configuration des permissions..."

# Récupérer le numéro du projet
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Donner accès au compte de service Cloud Run
gcloud secrets add-iam-policy-binding budget-database-url \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

gcloud secrets add-iam-policy-binding budget-secret-key \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo ""
log_info "✅ Secrets configurés avec succès!"
echo ""
echo "Secrets créés:"
echo "  - budget-database-url"
echo "  - budget-secret-key"
echo ""
echo "Tu peux maintenant lancer: ./cloud/deploy.sh"
