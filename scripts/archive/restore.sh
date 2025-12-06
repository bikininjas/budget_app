#!/bin/bash
# Script de restauration de la base de données PostgreSQL
# Usage: ./scripts/restore.sh <fichier_backup.sql.gz>

set -e

# Configuration
CONTAINER_NAME="budget_db"
BACKUP_DIR="./backups"

# Charger les variables d'environnement si le fichier existe
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_USER="${POSTGRES_USER:-budget_user}"
DB_NAME="${POSTGRES_DB:-budget_db}"

# Vérifier les arguments
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <fichier_backup.sql.gz>"
    echo ""
    echo "📂 Backups disponibles:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "   Aucun backup trouvé"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier si le fichier existe (chemin relatif ou absolu)
if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier backup non trouvé: $1"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va remplacer toutes les données existantes!"
echo "   Container: $CONTAINER_NAME"
echo "   Database: $DB_NAME"
echo "   Backup: $BACKUP_FILE"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restauration annulée"
    exit 1
fi

echo "🔄 Restauration de la base de données..."

# Restaurer le backup
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "✅ Restauration terminée avec succès!"
