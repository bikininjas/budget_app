# Budget App 💰

Application de gestion de budget familial pour Marie et Seb.

## 🚀 Fonctionnalités

- **Gestion des dépenses** : Ajouter, modifier et supprimer des dépenses
- **Assignation des dépenses** : Attribuer chaque dépense à Marie ou Seb
- **Comptes bancaires** : 
  - Caisse d'Épargne Joint
  - Caisse d'Épargne Seb
  - Caisse d'Épargne Marie
  - N26 Seb
- **Répartition des dépenses** :
  - 50/50
  - 1/3 - 2/3
  - 2/3 - 1/3
  - 100% Marie
  - 100% Seb
- **Catégories** : Organisation des dépenses par catégorie (Alimentation, Logement, Transport, etc.)
- **Projets** : Suivi de budget pour des projets spécifiques (vacances, travaux, etc.)
- **Graphiques** : Visualisation des dépenses par mois et par catégorie
- **Balance** : Calcul automatique de qui doit combien à qui
- **Authentification** : Connexion sécurisée avec JWT

## 🛠️ Stack technique

### Backend
- **Python 3.12** avec FastAPI
- **PostgreSQL** avec SQLAlchemy (async)
- **Alembic** pour les migrations
- **Pydantic v2** pour la validation
- **Ruff** pour le linting

### Frontend
- **Next.js 15** avec App Router
- **React 19** avec TypeScript
- **TanStack Query v5** pour la gestion des données
- **Recharts** pour les graphiques
- **Tailwind CSS** pour le styling
- **Bun** comme gestionnaire de packages

### Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** comme reverse proxy
- **GitHub Actions** pour CI/CD
- **Google Cloud Run** pour l'hébergement

## 📁 Structure du projet

```
budget_app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── routes/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── alembic/
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
├── nginx/
├── .github/workflows/
├── docker-compose.yml
└── docker-compose.dev.yml
```

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Node.js 22+ et Bun (pour le développement local)
- Python 3.12+ (pour le développement local)

### Développement avec Docker

```bash
# Copier les variables d'environnement
cp .env.example .env

# Démarrer les services de développement
docker compose -f docker-compose.dev.yml up -d

# Exécuter les migrations
docker compose exec backend alembic upgrade head
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

### Développement local (sans Docker)

#### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` sur Windows

# Installer les dépendances
pip install -e ".[dev]"

# Configurer les variables d'environnement
export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/budget_db"
export SECRET_KEY="dev-secret-key"
export CORS_ORIGINS="http://localhost:3000"

# Exécuter les migrations
alembic upgrade head

# Démarrer le serveur
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Installer les dépendances
bun install

# Configurer les variables d'environnement
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Démarrer le serveur de développement
bun dev
```

## 🔐 Authentification

### Utilisateurs par défaut

| Username | Password | Rôle |
|----------|----------|------|
| seb | changeme123 | admin |
| marie | changeme123 | user |

⚠️ **Important** : Changez ces mots de passe en production !

### API Endpoints

```
POST /api/auth/login          # Connexion
POST /api/auth/register       # Inscription
POST /api/auth/refresh        # Rafraîchir le token
GET  /api/users/me            # Utilisateur courant
```

## 📊 API Documentation

Une documentation interactive Swagger est disponible sur `/docs` lorsque le backend est en cours d'exécution.

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/expenses | Liste des dépenses |
| POST | /api/expenses | Créer une dépense |
| PUT | /api/expenses/{id} | Modifier une dépense |
| DELETE | /api/expenses/{id} | Supprimer une dépense |
| GET | /api/expenses/stats/monthly/{year} | Stats mensuelles |
| GET | /api/expenses/stats/by-category | Stats par catégorie |
| GET | /api/categories | Liste des catégories |
| GET | /api/accounts | Liste des comptes |
| GET | /api/projects | Liste des projets |

## 🚢 Déploiement

### Google Cloud Run

1. Configurer les secrets GitHub :
   - `GCP_PROJECT_ID`
   - `WIF_PROVIDER` (Workload Identity Federation)
   - `WIF_SERVICE_ACCOUNT`
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `CORS_ORIGINS`

2. Push sur la branche `main` pour déclencher le déploiement automatique

### Docker Compose (Production)

```bash
# Avec le profil production (inclut Nginx)
docker compose --profile production up -d
```

## 🧪 Tests

### Backend

```bash
cd backend
pytest --cov=app
```

### Linting

```bash
# Backend
cd backend
ruff check .
ruff format .

# Frontend
cd frontend
bun lint
```

## 📝 Migrations

```bash
# Créer une nouvelle migration
cd backend
alembic revision --autogenerate -m "description"

# Appliquer les migrations
alembic upgrade head

# Annuler la dernière migration
alembic downgrade -1
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📜 Licence

Ce projet est privé et destiné à un usage personnel.

---

Made with ❤️ pour Marie et Seb
