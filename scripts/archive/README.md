# Scripts archivés

Ces scripts sont obsolètes et ont été remplacés par des workflows GitHub Actions.

## Pourquoi archivés ?

### `backup.sh` → `.github/workflows/backup.yml`
- Backup automatique daily à 3h UTC
- Utilise GCP Secret Manager pour les credentials
- Upload vers Google Cloud Storage
- Rétention configurable

**Utiliser à la place :**
- Workflow automatique : `.github/workflows/backup.yml`
- Déclenchement manuel : GitHub Actions UI
- Restauration : GCP Console ou workflow restore (à créer si besoin)

### `restore.sh` → GCP Console / SQL Client
- La restauration se fait maintenant via :
  - GCP Console (Neon.tech dashboard)
  - `psql` avec les credentials depuis Secret Manager
  - Ou créer un workflow restore si besoin fréquent

### `migrate-to-cloud.sh` → Migration terminée
- Migration vers Cloud Run + Neon déjà effectuée
- Ce script était pour la migration initiale
- Plus nécessaire maintenant que l'infra est en place

## Si tu en as besoin

Les scripts sont conservés ici pour référence. Tu peux les adapter si besoin.
