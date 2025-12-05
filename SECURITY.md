# Security Configuration

## API Key Protection (Optional)

L'API backend peut être protégée par une clé API pour empêcher l'accès direct depuis l'extérieur.

### Configuration

#### 1. Backend (Cloud Run)

Ajouter le secret `API_KEY` dans GCP Secret Manager :

```bash
echo -n "your-random-api-key-here" | gcloud secrets create api-key --data-file=-
```

Puis mettre à jour le service backend dans le workflow `.github/workflows/deploy.yml` :

```yaml
--set-secrets="...,API_KEY=api-key:latest"
```

#### 2. Frontend (Cloud Run)

Ajouter la variable d'environnement au déploiement :

```yaml
--set-env-vars="NEXT_PUBLIC_API_KEY=your-random-api-key-here"
```

**⚠️ Note:** L'API key frontend sera visible dans le code JavaScript. Cette protection empêche l'accès direct mais n'est pas absolue. Pour une vraie sécurité, utilisez Cloud Run Ingress + VPC.

### Génération d'une API key sécurisée

```bash
openssl rand -hex 32
```

### Comportement

- **Sans API_KEY configuré** : Pas de vérification, backend accessible par tous
- **Avec API_KEY configuré** : Backend rejette toute requête sans header `X-API-Key` valide

## Protection avancée (Cloud Run Ingress)

Pour bloquer complètement l'accès externe au backend :

1. Configurer le backend avec `--ingress=internal-and-cloud-load-balancing`
2. Utiliser un Load Balancer Google Cloud entre frontend et backend
3. Le backend ne sera accessible que via le Load Balancer interne

Cette configuration nécessite plus de setup mais offre une vraie isolation réseau.
