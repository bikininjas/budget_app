# Scripts Budget App

Ce dossier contient les scripts utilitaires pour le projet DuoBudget.

## 🚀 Scripts actifs (à utiliser)

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

## 🔧 Maintenance

Les scripts CI sont maintenus en sync avec les workflows GitHub Actions.
Pour ajouter un nouveau check, mettre à jour les deux.
