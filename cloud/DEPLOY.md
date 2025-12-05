# 🚀 Guide de Déploiement - Google Cloud Run

Ce guide te permet de déployer Budget App sur Google Cloud Run pour **~$0/mois**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Run                         │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │    Frontend     │ ──────► │     Backend     │           │
│  │   (Next.js)     │         │    (FastAPI)    │           │
│  │   $0/mois       │         │    $0/mois      │           │
│  └─────────────────┘         └────────┬────────┘           │
│                                       │                     │
│         Google Secret Manager         │                     │
│         (DATABASE_URL, SECRET_KEY)    │                     │
└───────────────────────────────────────┼─────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   Neon.tech     │
                              │  (PostgreSQL)   │
                              │   $0/mois       │
                              └─────────────────┘
```

## Prérequis

- Compte Google Cloud avec facturation activée
- Compte Neon.tech (gratuit)

---

## Étape 1: Installer gcloud CLI

```bash
# Linux/macOS
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xf google-cloud-cli-linux-x86_64.tar.gz
./google-cloud-sdk/install.sh

# Redémarrer le terminal, puis:
gcloud init
gcloud auth login
```

Ou suivre: https://cloud.google.com/sdk/docs/install

---

## Étape 2: Créer un compte Neon (base de données gratuite)

1. Aller sur https://neon.tech
2. Créer un compte (gratuit)
3. Créer un nouveau projet "budget-app"
4. Copier la **connection string** (format PostgreSQL)

⚠️ **Important**: Modifier le format pour Python asyncpg:
```
# Neon te donne:
postgresql://user:pass@host/db?sslmode=require

# Tu dois changer en:
postgresql+asyncpg://user:pass@host/db?sslmode=require
```

---

## Étape 3: Configurer les secrets

Les secrets (mots de passe, clés) ne sont **jamais** stockés en clair. Ils sont dans Google Secret Manager.

```bash
# Rendre le script exécutable
chmod +x cloud/setup-secrets.sh

# Lancer la configuration
./cloud/setup-secrets.sh
```

Le script te demandera ta DATABASE_URL Neon de manière interactive.

---

## Étape 4: Déployer

```bash
# Rendre les scripts exécutables
chmod +x cloud/*.sh

# Déployer tout (backend + frontend)
./cloud/deploy.sh all

# Ou séparément:
./cloud/deploy.sh backend
./cloud/deploy.sh frontend
```

Le script va:
1. Créer les images Docker
2. Les pousser vers Artifact Registry
3. Déployer sur Cloud Run
4. Configurer les variables d'environnement

---

## Étape 5: Exécuter les migrations

Après le premier déploiement, il faut créer les tables dans Neon:

```bash
# Récupérer l'URL de la base depuis Secret Manager
export DATABASE_URL=$(gcloud secrets versions access latest --secret=budget-database-url)

# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Exécuter les migrations
alembic upgrade head
```

---

## Étape 6: Tester

Le script affiche les URLs à la fin. Tu peux aussi les retrouver:

```bash
# URL du frontend
gcloud run services describe budget-frontend --region europe-west1 --format 'value(status.url)'

# URL du backend
gcloud run services describe budget-backend --region europe-west1 --format 'value(status.url)'
```

---

## 💾 Backups

### Backup manuel

```bash
# Backup vers fichier local
./cloud/backup-neon.sh

# Les backups sont dans ./backups/
```

### Backup vers Google Drive

1. Installer rclone: `sudo apt install rclone`
2. Configurer: `rclone config` (choisir Google Drive, nommer "gdrive")
3. Le script demandera si tu veux uploader vers Drive

### Restaurer un backup

```bash
./cloud/restore-neon.sh ./backups/budget_neon_YYYYMMDD_HHMMSS.sql.gz
```

---

## 📊 Monitoring & Logs

```bash
# Voir les logs du backend
gcloud run services logs read budget-backend --region europe-west1

# Voir les logs du frontend
gcloud run services logs read budget-frontend --region europe-west1

# Console Google Cloud
open https://console.cloud.google.com/run?project=sebsandbbox
```

---

## 💰 Coûts estimés

| Service | Free tier | Ton usage estimé | Coût |
|---------|-----------|------------------|------|
| Cloud Run Frontend | 2M req/mois | ~1000 req/mois | $0 |
| Cloud Run Backend | 2M req/mois | ~5000 req/mois | $0 |
| Neon PostgreSQL | 0.5 GB | ~50 MB | $0 |
| Secret Manager | 6 secrets actifs | 2 secrets | $0 |
| **Total** | | | **$0/mois** |

⚠️ Si tu dépasses le free tier (très improbable pour un usage perso), le coût serait de quelques euros.

---

## 🔧 Troubleshooting

### Erreur "Cold start" lent (3-5 secondes)

C'est normal avec `min-instances: 0`. Le container démarre à la demande.

Pour réduire (mais augmente les coûts):
```bash
gcloud run services update budget-backend --min-instances 1 --region europe-west1
```

### Erreur de connexion à la base de données

1. Vérifier que le secret est bien configuré:
```bash
gcloud secrets versions access latest --secret=budget-database-url
```

2. Vérifier que l'URL contient `+asyncpg` et `?sslmode=require`

### Erreur CORS

Mettre à jour les CORS:
```bash
FRONTEND_URL=$(gcloud run services describe budget-frontend --region europe-west1 --format 'value(status.url)')
gcloud run services update budget-backend --region europe-west1 --set-env-vars="CORS_ORIGINS=$FRONTEND_URL,http://localhost:3001"
```

---

## 💾 Backups Automatiques

Les backups de la base de données sont effectués **automatiquement tous les jours à 4h** (heure française) via GitHub Actions.

### Fonctionnement

- Les backups sont stockés dans Google Cloud Storage (`gs://budget-app-backups/`)
- Rétention automatique de **30 jours** (les vieux backups sont supprimés automatiquement)
- Format: `budget_backup_YYYYMMDD_HHMMSS.sql.gz`

### Lancer un backup manuellement

1. Aller sur https://github.com/bikininjas/budget_app/actions
2. Cliquer sur "Daily Database Backup"
3. Cliquer sur "Run workflow"

### Restaurer un backup

```bash
# Lister les backups disponibles
gsutil ls -l gs://budget-app-backups/

# Télécharger un backup
gsutil cp gs://budget-app-backups/budget_backup_XXXXXXXX_XXXXXX.sql.gz .

# Décompresser
gunzip budget_backup_XXXXXXXX_XXXXXX.sql.gz

# Restaurer (remplacer DATABASE_URL par ta vraie URL)
psql "$DATABASE_URL" < budget_backup_XXXXXXXX_XXXXXX.sql
```

---

## 🔄 Mises à jour

Pour redéployer après des modifications:

```bash
# Redéployer uniquement le backend
./cloud/deploy.sh backend

# Redéployer uniquement le frontend
./cloud/deploy.sh frontend

# Redéployer tout
./cloud/deploy.sh all
```

---

## 🗑️ Suppression

Pour tout supprimer et arrêter les coûts:

```bash
# Supprimer les services Cloud Run
gcloud run services delete budget-backend --region europe-west1 --quiet
gcloud run services delete budget-frontend --region europe-west1 --quiet

# Supprimer les images
gcloud artifacts repositories delete budget-app --location europe-west1 --quiet

# Supprimer les secrets
gcloud secrets delete budget-database-url --quiet
gcloud secrets delete budget-secret-key --quiet
```

La base Neon peut être supprimée depuis leur dashboard.
