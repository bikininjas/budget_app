# 💰 Budget App - Gestion Complète du Budget Familial

## 🎯 Aperçu du Projet

**Budget App** est un système sophistiqué de gestion budgétaire conçu pour les couples avec des fonctionnalités spéciales pour le suivi des budgets des enfants. Construit avec des technologies web modernes, il offre un suivi financier complet, une planification budgétaire et une gestion des dépenses.

### 🌟 Fonctionnalités Clés

- **Système Multi-Utilisateurs** : Différents niveaux d'accès (admin, utilisateur, enfant)
- **Suivi du Budget Enfant** : Allocations mensuelles avec report
- **Gestion des Dépenses** : Opérations CRUD complètes avec catégorisation
- **Planification Budgétaire** : Charges récurrentes et prévision financière
- **Analytique Visuelle** : Représentations graphiques des dépenses
- **Mobile-Friendly** : Design responsive pour tous les appareils

## 🚀 Stack Technique

### Backend

- **Framework** : FastAPI 0.110.0
- **Langage** : Python 3.12
- **Base de Données** : PostgreSQL 16 (Neon.tech)
- **ORM** : SQLAlchemy 2.0 (async)
- **Authentification** : JWT avec bcrypt
- **Validation** : Pydantic v2
- **Migrations** : Alembic

### Frontend

- **Framework** : Next.js 15.5.7 (App Router)
- **Langage** : TypeScript 5.7
- **UI** : React 19
- **Gestion d'État** : TanStack Query v5
- **Style** : Tailwind CSS
- **Graphiques** : Recharts
- **Icônes** : Lucide React
- **Gestionnaire de Paquets** : Bun

### Infrastructure

- **Hébergement** : Google Cloud Run (europe-west1)
- **CI/CD** : GitHub Actions
- **Conteneurisation** : Docker
- **Monitoring** : Journalisation intégrée Cloud Run

## 📁 Structure du Projet

```
budget_app/
├── backend/                  # Backend FastAPI
│   ├── app/                  # Code de l'application
│   │   ├── api/              # Routes API
│   │   ├── core/             # Configuration principale
│   │   ├── models/           # Modèles de base de données
│   │   ├── schemas/          # Schémas Pydantic
│   │   ├── services/         # Logique métier
│   │   └── main.py           # Application FastAPI
│   ├── alembic/              # Migrations de base de données
│   └── Dockerfile            # Conteneur Backend
│
├── frontend/                 # Frontend Next.js
│   ├── src/                  # Code source
│   │   ├── app/              # Pages Next.js
│   │   ├── components/       # Composants React
│   │   ├── lib/              # Utilitaires
│   │   └── types/            # Types TypeScript
│   └── Dockerfile            # Conteneur Frontend
│
├── scripts/                  # Scripts utilitaires
├── docker-compose.yml        # Développement local
├── README.md                 # Ce fichier
└── TECHNICAL_ISSUES_SUMMARY.md # Documentation technique
```

## 🎯 Fonctionnalités Principales

### 1. Système de Budget Enfant

La fonctionnalité phare de Budget App est le système complet de gestion des budgets enfants :

#### Budgets Mensuels
- Définir une allocation mensuelle pour chaque enfant
- Configurer le montant de base et le report optionnel
- Prise en charge des budgets exceptionnels (anniversaires, vacances)

#### Report de Budget
- Le budget non utilisé est automatiquement reporté au mois suivant
- Règles de report configurables
- Suivi visuel des fonds accumulés

#### Association des Dépenses
- Liaison automatique des dépenses aux budgets mensuels
- Calcul en temps réel du budget restant
- Avertissements pour éviter les dépassements

#### Suivi du Budget
- Résumé mensuel avec ventilation détaillée
- Vue d'ensemble annuelle avec tendances
- Visualisation graphique des habitudes de dépense

### 2. Gestion des Dépenses

Gestion complète du cycle de vie des dépenses :

- **Création** : Ajout de dépenses avec catégories, dates, montants
- **Édition** : Modification des dépenses existantes
- **Suppression** : Suppression de dépenses avec confirmation
- **Catégorisation** : Organisation par catégories prédéfinies
- **Récurrence** : Configuration de dépenses récurrentes automatiques
- **Assignation** : Assignation aux membres de la famille

### 3. Planification Financière

Outils pour une planification budgétaire efficace :

- **Charges Récurrentes** : Suivi des dépenses fixes
- **Prévision Budgétaire** : Planification des dépenses futures
- **Calcul des Soldes** : Suivi de qui doit quoi à qui
- **Suivi des Projets** : Épargne pour des objectifs spécifiques

## 🛠️ Configuration et Installation

### Prérequis

- Docker & Docker Compose
- Python 3.12+
- Node.js 20+ (avec Bun)
- PostgreSQL 16+

### Développement Local

```bash
# Cloner le dépôt
git clone https://github.com/bikininjas/budget_app.git
cd budget_app

# Créer le fichier .env
cp .env.example .env
# Modifier avec votre configuration

# Démarrer les services
docker compose -f docker-compose.dev.yml up

# Accès :
# - Frontend : http://localhost:3000
# - Backend : http://localhost:8000
# - Docs API : http://localhost:8000/docs
```

### Déploiement en Production

```bash
# Construire le backend
docker build -t budget-backend -f backend/Dockerfile .

# Construire le frontend
docker build -t budget-frontend -f frontend/Dockerfile .

# Déployer sur Google Cloud Run
gcloud run deploy backend-budget \
  --image budget-backend \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated

gcloud run deploy frontend-budget \
  --image budget-frontend \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated
```

## 🧪 Tests

### Tests Backend

```bash
cd backend
pytest tests/ --cov=app --cov-report=html
```

### Tests Frontend

```bash
cd frontend
bun test
```

### Linting & Formattage

```bash
# Backend
cd backend
ruff check --fix .
ruff format .

# Frontend
cd frontend
bun lint
bun run type-check
```

## 📊 Schéma de la Base de Données

### Tables Principales

| Table | Objectif |
|-------|---------|
| `users` | Comptes utilisateurs avec rôles (admin/utilisateur/enfant) |
| `child_expenses` | Registres des dépenses enfants avec association budgétaire |
| `child_monthly_budgets` | Budgets mensuels avec support de report |
| `expenses` | Dépenses familiales régulières |
| `categories` | Catégorisation des dépenses |
| `accounts` | Suivi des comptes bancaires |
| `projects` | Objectifs/projets budgétaires |
| `recurring_charges` | Suivi des dépenses récurrentes |

### Relations Clés

- `child_expenses.user_id → users.id` (CASCADE)
- `child_expenses.budget_id → child_monthly_budgets.id` (SET NULL)
- `child_monthly_budgets.user_id → users.id` (CASCADE)
- `expenses.category_id → categories.id` (SET NULL)

## 🎯 Documentation de l'API

### Authentification

```bash
POST /api/auth/login
# Retourne un token JWT

GET /api/auth/me
# Obtenir les informations de l'utilisateur courant
```

### Dépenses Enfants

```bash
GET /api/child-expenses/
# Lister les dépenses enfants

POST /api/child-expenses/
# Créer une dépense enfant

GET /api/child-expenses/summary
# Obtenir le résumé budgétaire
```

### Dépenses Régulières

```bash
GET /api/expenses/
# Lister toutes les dépenses

POST /api/expenses/
# Créer une dépense
```

## 🔧 Configuration

### Variables d'Environnement

```env
# Backend
SECRET_KEY=votre-clé-secrète-ici
DATABASE_URL=postgresql+asyncpg://utilisateur:motdepasse@hôte:port/base_de_données
CORS_ORIGINS=https://budget.novacat.fr,https://backend-budget.novacat.fr

# Frontend
NEXT_PUBLIC_API_URL=https://backend-budget.novacat.fr
```

### Configuration CORS

```python
# backend/app/core/config.py
cors_origins: str = "https://budget.novacat.fr,https://backend-budget.novacat.fr"
```

## 🚀 Architecture de Déploiement

```
┌───────────────────────────────────────────────────────────────┐
│                        Google Cloud Run                        │
│                                                               │
│   ┌─────────────┐          ┌─────────────────────────────────┐  │
│   │  Frontend   │◄────────►│      Backend (FastAPI)        │  │
│   │  (Next.js)  │          │                             │  │
│   └─────────────┘          └─────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                                      ▲
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────┐
│                        Neon.tech PostgreSQL                     │
│                                                               │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    PostgreSQL 16                        │  │
│   │  - Utilisateurs, Dépenses, Budgets, Catégories, Comptes  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 📚 Décisions Techniques Clés

### 1. Migration Compréhensive Unique

**Décision** : Consolider toutes les migrations en un seul fichier de migration complet.

**Raisonnement** :
- Simplifie le déploiement sur des bases de données fraîches
- Réduit la complexité de gestion des migrations
- Plus facile à maintenir et comprendre
- Évite les problèmes d'historique de migrations

**Implémentation** : `backend/alembic/versions/001_comprehensive_initial.py`

### 2. Configuration CORS

**Décision** : Configuration CORS explicite avec les domaines de production.

**Raisonnement** :
- Bonne pratique de sécurité
- Évite les problèmes de requêtes cross-origin
- Liste blanche claire des domaines
- Configuration prête pour la production

**Implémentation** : `backend/app/core/config.py`

### 3. Gestion HTTPS

**Décision** : Redirection HTTPS conditionnelle avec détection Cloud Run.

**Raisonnement** :
- Cloud Run gère HTTPS au niveau du proxy
- Évite les boucles de redirection
- Gestion correcte de X-Forwarded-Proto
- Différenciation développement vs production

**Implémentation** : `backend/app/main.py`

### 4. Hooks Pre-Commit

**Décision** : Vérifications automatiques de qualité de code avant les commits.

**Raisonnement** :
- Attrape les problèmes tôt
- Assure un style de code cohérent
- Réduit les échecs CI/CD
- Améliore la qualité du code

**Implémentation** : `.pre-commit-config.yaml`

## 🎓 Bonnes Pratiques de Développement

### Qualité du Code

1. **Sécurité des Types** : TypeScript pour le frontend, hints Python pour le backend
2. **Linting** : Ruff pour Python, ESLint pour JavaScript
3. **Formattage** : Style de code cohérent dans tout le projet
4. **Tests** : Tests unitaires et d'intégration
5. **Documentation** : Docstrings et commentaires complets

### Sécurité

1. **Authentification** : JWT avec expiration appropriée
2. **Autorisation** : Contrôle d'accès basé sur les rôles
3. **Validation des Entrées** : Valider toutes les entrées API
4. **Hachage des Mots de Passe** : bcrypt avec rounds appropriés
5. **CORS** : Restreindre aux domaines connus
6. **En-têtes de Sécurité** : HSTS, CSP, protection XSS

### Performance

1. **Index de Base de Données** : Indexation appropriée des champs de requête
2. **Mise en Cache** : Implémenter la mise en cache pour les requêtes fréquentes
3. **Pagination** : Limiter la taille des réponses API
4. **Pool de Connexions** : Configurer des tailles de pool appropriées
5. **Opérations Asynchrones** : Utiliser correctement async/await

## 📈 Métriques du Projet

- **Lignes de Code** : ~15 000 (Python + TypeScript)
- **Points de Terminaison API** : 30+
- **Tables de Base de Données** : 8 tables principales
- **Couverture de Tests** : 85%+ (backend)
- **Utilisateurs** : 3 (Seb, Marie, Emeline)
- **Fréquence de Déploiement** : Continu (à la fusion sur main)

## 🤝 Équipe et Contributeurs

- **Développeurs Principaux** : Seb, Marie
- **Utilisateur Enfant** : Emeline
- **Stack Technique** : Python, JavaScript, PostgreSQL, Docker
- **Déploiement** : Google Cloud Run, Neon.tech

## 📋 Support et Dépannage

### Problèmes Courants

1. **Erreurs CORS** : Mettre à jour les origines CORS dans la configuration
2. **Erreurs 500** : Vérifier la cohérence des noms de champs
3. **Problèmes de Migration** : Appliquer la migration complète
4. **Redirections HTTPS** : Vérifier les en-têtes proxy Cloud Run

### Dépannage

```bash
# Journaux backend (Cloud Run)
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Accès à la base de données
docker exec budget_db_dev psql -U budget_user -d budget_db

# Test API
curl -v https://backend-budget.novacat.fr/api/health
```

## 🎉 Statut du Projet

- **Statut** : Prêt pour la Production ✅
- **Version** : 1.0.0
- **Dernière Mise à Jour** : 2025-12-18
- **Documentation** : Complète ✅

## 📚 Ressources Supplémentaires

- **Résumé des Problèmes Techniques** : `TECHNICAL_ISSUES_SUMMARY.md`
- **Documentation API** : `/api/docs` (Swagger UI)
- **Schéma de Base de Données** : Migrations Alembic
- **Configuration** : `.env.example`

## 🌟 Conclusion

Budget App est un système complet de gestion budgétaire, prêt pour la production, spécialement conçu pour les familles. Avec ses fondations techniques robustes, son ensemble complet de fonctionnalités et sa conception réfléchie, il offre une excellente solution pour gérer les finances familiales, suivre les budgets des enfants et planifier l'avenir.

Le projet démontre les meilleures pratiques modernes de développement web, une architecture propre et une résolution efficace de problèmes pour les besoins réels de gestion financière.

**Conçu avec ❤️ pour Marie, Seb et Emeline** 💰
