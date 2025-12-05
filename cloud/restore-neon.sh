#!/bin/bash
# =============================================================================
# Script de restauration vers Neon PostgreSQL
# =============================================================================
# Usage: ./cloud/restore-neon.sh <backup_file.sql.gz>
# =============================================================================

set -e

BACKUP_FILE=$1

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -la ./backups/budget_neon_*.sql.gz 2>/dev/null || echo "  Aucun backup trouvé"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Fichier non trouvé: $BACKUP_FILE"
    exit 1
fi

# Récupérer DATABASE_URL
get_database_url() {
    if [ -n "$DATABASE_URL" ]; then
        echo "$DATABASE_URL"
    elif command -v gcloud &> /dev/null; then
        gcloud secrets versions access latest --secret=budget-database-url 2>/dev/null || echo ""
    else
        echo ""
    fi
}

DATABASE_URL=$(get_database_url)

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL non trouvée."
    exit 1
fi

# Convertir l'URL
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/postgresql+asyncpg/postgresql/')

log_warn "⚠️  ATTENTION: Cette opération va écraser les données existantes!"
read -p "Continuer? (oui/N) " -r
if [[ ! $REPLY == "oui" ]]; then
    log_info "Restauration annulée."
    exit 0
fi

log_info "Restauration depuis: $BACKUP_FILE"

# Décompression et restauration
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql "$PSQL_URL"
else
    psql "$PSQL_URL" < "$BACKUP_FILE"
fi

log_info "✅ Restauration terminée!"
