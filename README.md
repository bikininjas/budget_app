# Budget App 💰

Application de gestion de budget familial pour Marie et Seb.

## 🚨 Erreur 500 en Production ?

Si le backend retourne une erreur 500 après un déploiement:

```bash
# Lance le script de diagnostic
./scripts/fix-production-500.sh
```

**Cause probable**: Migration de base de données non appliquée.

**Solution rapide**:
1. Récupère ta DATABASE_URL de Neon.tech
2. Applique les migrations:
```bash
cd backend
export DATABASE_URL='<ton-url-neon>'
alembic upgrade head
```

Voir le script `./scripts/fix-production-500.sh` pour les instructions détaillées.

## 🚀 Fonctionnalités

### Gestion des dépenses
- **Dépenses** : Ajouter, modifier et supprimer des dépenses
- **Assignation** : Attribuer chaque dépense à Marie, Seb ou Emeline
- **Dépenses récurrentes** : Marquer les dépenses qui reviennent chaque mois
- **Historique** : Vue mensuelle de toutes les dépenses avec tendances

### Budget prévisionnel
- **Charges fixes** : Gérer les dépenses récurrentes à prévoir (loyer, assurances, abonnements...)
- **Fréquence** : Mensuel, trimestriel ou annuel
- **Calcul automatique** : Conversion en montant mensuel équivalent

### Gestion des comptes bancaires
- **CRUD complet** : Créer, modifier et supprimer des comptes bancaires
- **Types de comptes** : Compte courant, compte épargne, compte joint
- **Suivi des soldes** : Balance initiale et solde courant pour chaque compte

### Budget enfant (Emeline)
- **Suivi des dépenses** : Emeline peut gérer ses propres achats
- **Budget mensuel** : Paramétrable par les parents (admin)
- **Graphiques dédiés** : Visualisation des dépenses et budget restant
- **Contrôle parental** : Seuls les admins peuvent modifier le budget mensuel

### Répartition des dépenses
- 50/50
- 1/3 - 2/3
- 2/3 - 1/3
- 100% Marie
- 100% Seb
- 100% Emeline

### Autres fonctionnalités
- **Catégories** : Organisation des dépenses (Alimentation, Logement, Transport, etc.)
- **Projets** : Suivi de budget pour des projets spécifiques (vacances, travaux...)
- **Graphiques** : Visualisation des dépenses par mois et par catégorie
- **Balance** : Calcul automatique de qui doit combien à qui
- **Dark mode** : Interface adaptée au thème système avec excellent contraste
- **Responsive** : Design adapté mobile et desktop

## 🛠️ Stack technique

### Backend
- **Python 3.12** avec FastAPI
- **PostgreSQL 16** avec SQLAlchemy 2.0 (async)
- **Alembic** pour les migrations
- **Pydantic v2** pour la validation
- **bcrypt** pour le hashage des mots de passe
- **JWT** pour l'authentification

### Frontend
- **Next.js 15.5.7** avec App Router
- **React 19** avec TypeScript 5.7
- **TanStack Query v5** pour la gestion des données
- **Recharts** pour les graphiques
- **Tailwind CSS** avec dark mode
- **Lucide React** pour les icônes
- **Bun** comme gestionnaire de packages

### Infrastructure & Déploiement
- **Google Cloud Run** (europe-west1)
- **Neon.tech PostgreSQL** (production)
- **GitHub Actions** pour CI/CD
- **Docker** pour le build et développement local
- Scripts de **backup/restore**

## 📁 Structure du projet

```
budget_app/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Endpoints API
│   │   ├── core/                # Config, DB, sécurité
│   │   ├── models/              # Modèles SQLAlchemy
│   │   ├── schemas/             # Schémas Pydantic
│   │   ├── services/            # Logique métier
│   │   └── main.py
│   ├── alembic/versions/        # Migrations DB
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/(dashboard)/     # Pages de l'app
│   │   │   ├── dashboard/       # Tableau de bord
│   │   │   ├── expenses/        # Gestion dépenses
│   │   │   ├── budget/          # Charges fixes
│   │   │   ├── accounts/        # Comptes bancaires
│   │   │   ├── emeline-budget/  # Budget enfant
│   │   │   ├── categories/      # Catégories
│   │   │   └── projects/        # Projets
│   │   ├── components/          # Composants React
│   │   ├── contexts/            # Auth context
│   │   ├── lib/api/             # Clients API
│   │   └── types/               # Types TypeScript
│   └── Dockerfile
├── scripts/
│   ├── ci-*.sh                  # Scripts CI/CD
│   ├── backup.sh                # Backup PostgreSQL
│   ├── restore.sh               # Restore PostgreSQL
│   └── check-emeline-user.sh    # Gestion utilisateur Emeline
├── .github/workflows/
│   └── deploy.yml               # CI/CD GitHub Actions
└── docker-compose.dev.yml       # Dev local
```

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Fichier `.env` avec les variables nécessaires (voir section Sécurité)

### Démarrage local

```bash
# Cloner le repo
git clone https://github.com/bikininjas/budget_app.git
cd budget_app

# Créer le fichier .env avec POSTGRES_PASSWORD et SECRET_KEY
cp .env.example .env  # Puis éditer avec vos valeurs

# Démarrer les services en mode dev
docker compose -f docker-compose.dev.yml up

# Les migrations sont appliquées automatiquement au démarrage
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

### Production

Déploiement automatique sur Google Cloud Run via GitHub Actions:
- **Frontend** : https://budget.novacat.fr
- **Backend** : https://backend-budget.novacat.fr

Push sur `master` → Build → Deploy automatique

## 🔐 Sécurité

### Variables d'environnement

Les secrets sont gérés via des variables d'environnement. Créez un fichier `.env` à la racine :

```bash
# Base de données
POSTGRES_USER=budget_user
POSTGRES_PASSWORD=<votre_mot_de_passe_securise>
POSTGRES_DB=budget_db

# Backend
SECRET_KEY=<clé_secrète_longue_et_aléatoire>
DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

⚠️ **Ne jamais commiter le fichier `.env`** - il est dans `.gitignore`

### Utilisateurs

Les utilisateurs sont créés automatiquement lors de la première migration.

| Username | Rôle | Accès |
|----------|------|-------|
| seb | admin | Tous les accès + gestion budget enfant |
| marie | user | Tous les accès sauf paramètres admin |
| emeline | child | Accès limité à son propre budget |

**Note**: En production, les mots de passe doivent être définis via la fonctionnalité "Set Password".

## 📊 API Documentation

Documentation Swagger interactive disponible sur `/docs`.

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/login | Connexion |
| GET | /api/expenses | Liste des dépenses |
| POST | /api/expenses | Créer une dépense |
| GET | /api/expenses/stats/history | Historique mensuel |
| GET | /api/recurring-charges | Charges fixes |
| GET | /api/recurring-charges/summary | Résumé budget |
| GET | /api/accounts | Comptes bancaires |
| POST | /api/accounts | Créer un compte |
| PUT | /api/accounts/{id} | Modifier un compte |
| DELETE | /api/accounts/{id} | Supprimer un compte |
| GET | /api/child-expenses | Dépenses enfant |
| POST | /api/child-expenses | Créer dépense enfant |
| GET | /api/child-expenses/summary | Résumé budget enfant |
| GET | /api/categories | Catégories |
| GET | /api/projects | Projets |
| GET | /api/users | Liste utilisateurs (admin) |
| PUT | /api/users/{id} | Modifier utilisateur (admin) |

## 💾 Backup & Restore

### Sauvegarder la base de données

```bash
./scripts/backup-db.sh
# Crée un fichier dans ./backups/
```

### Restaurer une sauvegarde

```bash
./scripts/restore-db.sh ./backups/budget_db_YYYYMMDD_HHMMSS.sql
```

## 🧪 Développement

### Développement local avec Docker

```bash
# Démarrer tous les services
docker compose -f docker-compose.dev.yml up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Scripts CI/CD locaux

Avant de push, exécuter les vérifications CI:

```bash
# Tout vérifier en une fois
./scripts/ci-all.sh

# Ou individuellement:
./scripts/ci-backend-lint.sh      # Ruff check + format
./scripts/ci-backend-test.sh      # Pytest (nécessite DB)
./scripts/ci-frontend-lint.sh     # ESLint + TypeScript
./scripts/ci-frontend-build.sh    # Build Next.js
./scripts/ci-docker-build.sh      # Build Docker images
```

### Linting manuel

```bash
# Backend
cd backend && ruff check --fix . && ruff format .

# Frontend  
cd frontend && bun lint && bun run type-check
```

## 📝 Migrations

```bash
# Créer une nouvelle migration (dev local)
docker compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "description"

# Appliquer les migrations (dev)
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Production (via Neon.tech)
cd backend
export DATABASE_URL='postgresql://...'  # URL Neon
alembic upgrade head
```

**Important**: Les migrations sont appliquées automatiquement au démarrage du backend en dev. En production, utiliser le script `./scripts/fix-production-500.sh` en cas de problème.

## 📜 Licence

Ce projet est privé et destiné à un usage personnel.

---

Made with ❤️ pour Marie et Seb
