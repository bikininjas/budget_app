#!/bin/bash
# =============================================================================
# Script de backup Neon PostgreSQL vers fichier local (puis Google Drive)
# =============================================================================
# Usage: ./cloud/backup-neon.sh
#
# Ce script:
# 1. Exporte la base de données Neon en SQL
# 2. Compresse le fichier
# 3. Optionnellement upload vers Google Drive via rclone
# =============================================================================

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="budget_neon_$DATE.sql"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# Récupérer DATABASE_URL depuis Secret Manager ou variable d'environnement
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
    echo ""
    echo "Options:"
    echo "  1. Définir DATABASE_URL: export DATABASE_URL='postgresql://...'"
    echo "  2. Ou s'authentifier avec gcloud: gcloud auth login"
    exit 1
fi

# Convertir l'URL asyncpg en URL psql standard
# postgresql+asyncpg://user:pass@host/db -> postgresql://user:pass@host/db
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/postgresql+asyncpg/postgresql/')

log_info "Démarrage du backup..."

# Export avec pg_dump
if command -v pg_dump &> /dev/null; then
    log_info "Export de la base de données..."
    pg_dump "$PSQL_URL" > "$BACKUP_DIR/$BACKUP_FILE"
else
    log_error "pg_dump n'est pas installé."
    echo "Installation: sudo apt install postgresql-client"
    exit 1
fi

# Compression
log_info "Compression du backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

log_info "Backup créé: $BACKUP_DIR/$BACKUP_FILE"
ls -lh "$BACKUP_DIR/$BACKUP_FILE"

# Upload vers Google Drive (optionnel, via rclone)
upload_to_drive() {
    if command -v rclone &> /dev/null; then
        if rclone listremotes | grep -q "gdrive:"; then
            log_info "Upload vers Google Drive..."
            rclone copy "$BACKUP_DIR/$BACKUP_FILE" gdrive:BudgetApp/backups/
            log_info "✅ Backup uploadé sur Google Drive"
        else
            log_warn "rclone configuré mais 'gdrive' remote non trouvé."
            echo "Configuration: rclone config"
        fi
    else
        log_warn "rclone non installé. Backup local uniquement."
        echo ""
        echo "Pour activer l'upload Google Drive:"
        echo "  1. Installer rclone: sudo apt install rclone"
        echo "  2. Configurer: rclone config"
        echo "     - Choisir 'Google Drive'"
        echo "     - Nommer le remote 'gdrive'"
    fi
}

# Demander si on veut uploader
echo ""
read -p "Uploader vers Google Drive? (o/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    upload_to_drive
fi

# Nettoyage des vieux backups (garder les 10 derniers)
log_info "Nettoyage des anciens backups..."
cd "$BACKUP_DIR" && ls -t budget_neon_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm --
cd - > /dev/null

log_info "✅ Backup terminé!"
echo ""
echo "Fichier: $BACKUP_DIR/$BACKUP_FILE"
