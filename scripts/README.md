# Scripts Budget App

Ce dossier contient les scripts utilitaires pour le projet DuoBudget.

## 🚀 Scripts actifs (à utiliser)

### Tests pré-push (NOUVEAUX - OBLIGATOIRES)
- **`test-all-before-push.sh`** - ⭐ **RECOMMANDÉ** - Teste backend + frontend avant chaque push
- **`test-backend-before-push.sh`** - Teste build Docker, migrations, et endpoints API
- **`test-frontend-before-push.sh`** - Teste TypeScript, ESLint, et build Docker

**Usage recommandé avant chaque push:**
```bash
# Test complet (rapide si builds récents)
./scripts/test-all-before-push.sh --skip-build

# Si échec, corriger et relancer
./scripts/test-all-before-push.sh --skip-build

# Puis push
git push origin master
```

Voir la documentation détaillée des tests en bas de ce fichier.

### Déploiement et monitoring
- **`check-deployment.sh`** - Vérifie le statut des services Cloud Run déployés
- **`wait-deployment.sh`** - Attend la fin du déploiement et guide l'utilisateur
- **`configure-domains.sh`** - Instructions pour mapper les domaines custom

### Tests et validation
- **`test-production.sh`** - Test complet end-to-end de la production (HTTPS, CORS, API)
- **`test-cors.sh`** - Vérifie la configuration CORS et Mixed Content

### CI/CD (utilisés par GitHub Actions ou localement)
- **`ci-all.sh`** - Lance tous les tests CI (lint + tests)
- **`ci-backend-lint.sh`** - Linting backend (ruff)
- **`ci-backend-test.sh`** - Tests backend (pytest)
- **`ci-backend-test-with-docker.sh`** - Tests backend avec Docker
- **`ci-frontend-lint.sh`** - Linting frontend (ESLint + TypeScript)
- **`ci-frontend-build.sh`** - Build frontend pour validation
- **`ci-docker-build.sh`** - Build images Docker

## 📦 Scripts archivés (obsolètes)

Déplacés vers `archive/` car remplacés par GitHub Actions workflows :

- **`backup.sh`** → Remplacé par `.github/workflows/backup.yml` (backup automatique daily)
- **`restore.sh`** → Utiliser workflow backup manuellement ou GCP console
- **`migrate-to-cloud.sh`** → Migration terminée, plus nécessaire

## 📝 Usage courant

### Après un déploiement
```bash
# Vérifier que tout est OK
./scripts/test-production.sh

# Vérifier les services Cloud Run
./scripts/check-deployment.sh
```

### Avant de commit
```bash
# Lancer tous les tests CI localement
./scripts/ci-all.sh
```

### En cas de problème Mixed Content/CORS
```bash
# Diagnostiquer
./scripts/test-cors.sh

# Tester la production
./scripts/test-production.sh
```

### Attendre un déploiement
```bash
# Surveiller et attendre la fin du deploy
./scripts/wait-deployment.sh
```

---

## 📝 Documentation Détaillée des Tests Pré-Push

### 🎯 `test-all-before-push.sh` - Suite Complète
**Recommandé pour la plupart des cas**

Exécute tous les tests (backend + frontend) avant de pusher.

```bash
# Exécuter tous les tests
./scripts/test-all-before-push.sh

# Passer les builds Docker (plus rapide si images récentes)
./scripts/test-all-before-push.sh --skip-build

# Garder les conteneurs actifs après les tests (pour debugging)
./scripts/test-all-before-push.sh --keep-running

# Tester uniquement le backend
./scripts/test-all-before-push.sh --backend-only

# Tester uniquement le frontend
./scripts/test-all-before-push.sh --frontend-only
```

### 🔧 `test-backend-before-push.sh` - Tests Backend
Teste le build Docker, les migrations, et les endpoints API.

**Ce qui est testé:**
- ✅ Build Docker réussit
- ✅ Conteneurs démarrent correctement
- ✅ Migrations de base de données s'appliquent avec succès
- ✅ Migration 005 crée la colonne `monthly_budget`
- ✅ Migration 005 crée la table `child_expenses`
- ✅ Authentification fonctionne (endpoint login)
- ✅ Tous les endpoints API principaux retournent des réponses valides:
  - `/api/health`
  - `/api/users/me`
  - `/api/expenses/`
  - `/api/expenses/stats/balance`
  - `/api/projects/` (GET, POST, PATCH)
  - `/api/categories/`
  - `/api/accounts/`
  - `/api/child-expenses/`
- ✅ Utilisateur Emeline existe avec rôle `child`

```bash
# Exécuter les tests backend
./scripts/test-backend-before-push.sh

# Passer le build Docker
./scripts/test-backend-before-push.sh --skip-build

# Garder l'environnement actif
./scripts/test-backend-before-push.sh --keep-running
```

### 🎨 `test-frontend-before-push.sh` - Tests Frontend
Teste les types TypeScript, le linting, et le build Docker.

**Ce qui est testé:**
- ✅ Dépendances s'installent correctement
- ✅ Types TypeScript sont valides (pas d'erreurs de compilation)
- ✅ ESLint passe (pas d'erreurs de linting)
- ✅ Build Docker réussit

```bash
# Exécuter les tests frontend
./scripts/test-frontend-before-push.sh

# Passer le build Docker
./scripts/test-frontend-before-push.sh --skip-build
```

### Workflow Typique

#### Avant Chaque Push
```bash
# Test rapide (suppose builds récents)
./scripts/test-all-before-push.sh --skip-build

# Si le test échoue, corriger et relancer
./scripts/test-all-before-push.sh --skip-build
```

#### Après Changements de Code
```bash
# Test complet avec builds frais
./scripts/test-all-before-push.sh

# Changements backend uniquement
./scripts/test-backend-before-push.sh

# Changements frontend uniquement
./scripts/test-frontend-before-push.sh
```

#### Débugger des Tests Échoués
```bash
# Garder les conteneurs actifs pour inspection
./scripts/test-backend-before-push.sh --keep-running

# Puis inspecter les logs
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend

# Accéder au backend
curl http://localhost:8000/api/health

# Quand le debugging est terminé
docker compose -f docker-compose.dev.yml down
```

### Comprendre les Résultats

#### ✅ Succès
```
╔════════════════════════════════════════╗
║                                        ║
║   ✓ ALL TESTS PASSED - READY TO PUSH  ║
║                                        ║
╚════════════════════════════════════════╝
```
Vous pouvez pusher en toute sécurité!

#### ❌ Échec
```
╔════════════════════════════════════════╗
║                                        ║
║   ✗ TESTS FAILED - DO NOT PUSH        ║
║                                        ║
╚════════════════════════════════════════╝
```
Corriger les erreurs affichées avant de pusher.

### Problèmes Communs

#### Migration Échoue
```
[✗] Migration failed
```
- Vérifier `backend/alembic/versions/` pour erreurs de syntaxe
- Lancer `docker compose -f docker-compose.dev.yml logs db` pour voir les erreurs base de données
- Vérifier que les valeurs enum ne sont pas en conflit

#### Erreurs TypeScript
```
[✗] TypeScript type errors found
```
- Vérifier la sortie pour les numéros de ligne spécifiques
- S'assurer que `frontend/src/types/index.ts` correspond aux schémas Pydantic backend
- Lancer `cd frontend && bunx tsc --noEmit` pour erreurs détaillées

#### ESLint Échoue
```
[✗] ESLint failed - fix linting errors
```
- Vérifier la sortie pour erreurs spécifiques
- Lancer `cd frontend && bun run lint` pour voir les détails
- Corriger les problèmes ou mettre à jour `.eslintrc` si nécessaire

#### Build Docker Échoue
```
[✗] Backend Docker build failed
```
- Vérifier les dépendances manquantes dans `requirements.txt`
- Vérifier la syntaxe du Dockerfile
- Chercher les erreurs d'import Python

#### Tests d'Endpoint Échouent
```
[✗] GET /api/expenses/ failed
```
- Vérifier si la migration s'est bien appliquée
- Vérifier que la base de données a les seed data
- Vérifier les logs backend: `docker compose -f docker-compose.dev.yml logs backend`

### Astuces Performance

- **Utiliser `--skip-build`** si vous n'avez pas changé les Dockerfiles ou dépendances (économise 30-60s)
- **Utiliser `--backend-only` ou `--frontend-only`** si vous n'avez changé qu'un côté
- **Utiliser `--keep-running`** pour débugger sans redémarrer les conteneurs
- **Lancer en parallèle**: Tester backend et frontend séparément dans différents terminaux

### Alignement CI/CD

Ces scripts testent les mêmes choses que GitHub Actions CI/CD va tester:
- ✅ Builds Docker (correspond à `.github/workflows/deploy.yml`)
- ✅ Compilation TypeScript (correspond à l'étape de build frontend)
- ✅ ESLint (correspond à l'étape de lint frontend)
- ✅ Fonctionnalité backend (valide migration + endpoints)

**Si les tests locaux passent, CI/CD devrait passer aussi!**

## 🔧 Maintenance

Les scripts CI sont maintenus en sync avec les workflows GitHub Actions.
Pour ajouter un nouveau check, mettre à jour les deux.
