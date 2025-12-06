#!/bin/bash
# Script de backup de la base de données PostgreSQL
# Usage: ./scripts/backup.sh [nom_du_backup]

set -e

# Configuration
CONTAINER_NAME="budget_db"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${1:-backup_$TIMESTAMP}"

# Charger les variables d'environnement si le fichier existe
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_USER="${POSTGRES_USER:-budget_user}"
DB_NAME="${POSTGRES_DB:-budget_db}"

# Créer le répertoire de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "🔄 Création du backup de la base de données..."
echo "   Container: $CONTAINER_NAME"
echo "   Database: $DB_NAME"
echo "   Output: $BACKUP_DIR/$BACKUP_NAME.sql.gz"

# Créer le backup compressé
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_DIR/$BACKUP_NAME.sql.gz"

# Vérifier si le backup a réussi
if [ -f "$BACKUP_DIR/$BACKUP_NAME.sql.gz" ] && [ -s "$BACKUP_DIR/$BACKUP_NAME.sql.gz" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.sql.gz" | cut -f1)
    echo "✅ Backup créé avec succès!"
    echo "   Fichier: $BACKUP_DIR/$BACKUP_NAME.sql.gz"
    echo "   Taille: $BACKUP_SIZE"
else
    echo "❌ Erreur lors de la création du backup"
    exit 1
fi

# Afficher les backups existants
echo ""
echo "📂 Backups disponibles:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "   Aucun backup trouvé"
