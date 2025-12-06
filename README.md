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
- **Assignation** : Attribuer chaque dépense à Marie ou Seb
- **Dépenses récurrentes** : Marquer les dépenses qui reviennent chaque mois
- **Historique** : Vue mensuelle de toutes les dépenses avec tendances

### Budget prévisionnel
- **Charges fixes** : Gérer les dépenses récurrentes à prévoir (loyer, assurances, abonnements...)
- **Fréquence** : Mensuel, trimestriel ou annuel
- **Calcul automatique** : Conversion en montant mensuel équivalent

### Comptes bancaires
- Caisse d'Épargne Joint
- Caisse d'Épargne Seb
- Caisse d'Épargne Marie
- N26 Seb

### Répartition des dépenses
- 50/50
- 1/3 - 2/3
- 2/3 - 1/3
- 100% Marie
- 100% Seb

### Autres fonctionnalités
- **Catégories** : Organisation des dépenses (Alimentation, Logement, Transport, etc.)
- **Projets** : Suivi de budget pour des projets spécifiques (vacances, travaux...)
- **Graphiques** : Visualisation des dépenses par mois et par catégorie
- **Balance** : Calcul automatique de qui doit combien à qui
- **Dark mode** : Interface adaptée au thème système
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
- **Next.js 15** avec App Router
- **React 19** avec TypeScript 5.7
- **TanStack Query v5** pour la gestion des données
- **Recharts** pour les graphiques
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **Bun** comme gestionnaire de packages

### Infrastructure
- **Docker** & **Docker Compose**
- **Volume PostgreSQL** persistant
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
│   │   ├── components/          # Composants React
│   │   ├── contexts/            # Auth context
│   │   ├── lib/api/             # Clients API
│   │   └── types/               # Types TypeScript
│   └── Dockerfile
├── scripts/
│   ├── backup-db.sh             # Backup PostgreSQL
│   ├── restore-db.sh            # Restore PostgreSQL
│   └── migrate-to-cloud.sh      # Guide migration cloud
└── docker-compose.yml
```

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose

### Démarrage

```bash
# Cloner le repo
git clone https://github.com/bikininjas/budget_app.git
cd budget_app

# Démarrer les services
docker compose up -d

# Exécuter les migrations
docker compose exec backend alembic upgrade head
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3001
- **Backend API** : http://localhost:8001
- **Documentation API** : http://localhost:8001/docs

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

### Utilisateurs par défaut (développement)

Les utilisateurs de test sont créés automatiquement lors de la première migration.

| Username | Rôle |
|----------|------|
| seb | admin |
| marie | user |

Le mot de passe par défaut est défini dans la migration seed et doit être changé en production.

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
| GET | /api/categories | Catégories |
| GET | /api/accounts | Comptes bancaires |
| GET | /api/projects | Projets |

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

### Backend (sans Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/budget_db"
export SECRET_KEY="dev-secret-key"

alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

### Frontend (sans Docker)

```bash
cd frontend
bun install
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
bun dev
```

### Linting

```bash
# Backend
cd backend && ruff check . && ruff format .

# Frontend
cd frontend && bun lint
```

## 📝 Migrations

```bash
# Créer une nouvelle migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Appliquer les migrations
docker compose exec backend alembic upgrade head

# Rollback
docker compose exec backend alembic downgrade -1
```

## 📜 Licence

Ce projet est privé et destiné à un usage personnel.

---

Made with ❤️ pour Marie et Seb
