# 🔍 Diagnostic & Debugging Tools

## Problème Mixed Content / HTTPS

Si tu rencontres des erreurs "Mixed Content" (HTTPS qui appelle HTTP), utilise ces outils pour diagnostiquer.

## 🌐 Page de Debug Frontend

**URL:** https://budget.novacat.fr/debug

Cette page affiche:
- ✅ Protocol du client (doit être HTTPS)
- ✅ Base URL de l'API (doit être HTTPS)
- ✅ Headers de sécurité backend (HSTS, CSP)
- ✅ Configuration CORS et IP filtering
- ❌ Toute erreur de connexion

**Comment l'utiliser:**
1. Ouvre https://budget.novacat.fr/debug dans ton navigateur
2. Vérifie que TOUS les indicateurs HTTPS sont ✅ verts
3. Si tu vois un ❌ rouge, c'est là le problème
4. Note l'erreur et cherche dans les logs

## 📊 Logs Cloud Run en Temps Réel

```bash
./scripts/view-logs.sh
```

Options:
1. **Backend seulement** - Voir les requêtes HTTP reçues par le backend
2. **Frontend seulement** - Voir les erreurs Next.js
3. **Les deux** - Vue complète

**Ce que tu verras dans les logs backend:**
```
📥 REQUEST: GET /api/expenses | Host=backend-budget.novacat.fr | Proto=https | IP=1.2.3.4 | Referer=https://budget.novacat.fr
📤 RESPONSE: 200 for /api/expenses
```

Si tu vois `Proto=http`, c'est le problème! Le backend force alors un redirect HTTPS.

## 🧪 Test HTTPS Automatique

```bash
./scripts/test-https.sh
```

Ce script:
- ✅ Teste que le frontend est accessible en HTTPS
- ✅ Vérifie que HTTP redirige vers HTTPS
- ✅ Teste le backend en HTTPS
- ✅ Affiche la config de debug
- ✅ Vérifie les headers de sécurité (HSTS, CSP)

**Résultat attendu:**
```
✅ Frontend is up (200)
✅ Backend is up (200)
Security Headers:
  strict-transport-security: max-age=31536000
  content-security-policy: upgrade-insecure-requests
```

## 🔒 Sécurité HTTPS Forcée

Le backend a maintenant plusieurs couches de protection:

### 1. Middleware de Redirection HTTPS
Si une requête HTTP arrive, elle est redirigée en HTTPS 308 (permanent).

### 2. Headers de Sécurité
Tous les responses incluent:
- **HSTS** (HTTP Strict Transport Security): Force le navigateur à utiliser HTTPS pendant 1 an
- **CSP** (Content Security Policy): `upgrade-insecure-requests` force l'upgrade HTTP→HTTPS
- **CSP**: `block-all-mixed-content` bloque tout contenu mixte

### 3. Logs Détaillés
Chaque requête est loggée avec:
- URL complète
- Protocol (HTTP/HTTPS)
- IP source
- Referer
- Headers X-Forwarded-*

## 📝 Checklist de Dépannage

Si tu vois encore des erreurs Mixed Content:

1. **Vide le cache du navigateur** (Ctrl+Shift+Del)
   - Le JS peut être caché avec les anciennes URLs HTTP
   
2. **Ouvre /debug en mode incognito**
   - Pas de cache = vraie situation
   
3. **Regarde la Console (F12)**
   - Cherche "Mixed Content" ou "blocked loading"
   - Note l'URL exacte qui pose problème
   
4. **Check les logs Cloud Run**
   ```bash
   ./scripts/view-logs.sh
   ```
   - Regarde si Proto=http apparaît
   - Vérifie que les redirects HTTPS fonctionnent
   
5. **Test avec curl**
   ```bash
   curl -I https://budget.novacat.fr/api/health
   ```
   - Cherche `strict-transport-security` dans les headers
   
6. **Vérifie la config backend**
   ```bash
   curl https://backend-budget.novacat.fr/api/debug/config | jq
   ```

## 🚀 Après le Déploiement

Après chaque déploiement:

```bash
# 1. Teste automatiquement
./scripts/test-https.sh

# 2. Ouvre /debug dans le navigateur
xdg-open https://budget.novacat.fr/debug

# 3. Surveille les logs pendant que tu testes
./scripts/view-logs.sh  # Option 3: Both
```

## 💡 Comprendre les Logs

### Log Normal (HTTPS OK)
```
📥 REQUEST: GET /api/expenses | Host=backend-budget.novacat.fr | Proto=https | IP=82.65.136.32 | Referer=https://budget.novacat.fr
📤 RESPONSE: 200 for /api/expenses
```
✅ Tout est bon: Proto=https, IP autorisée, Referer OK

### Log avec Redirect HTTPS
```
🚨 HTTP request detected! Forcing HTTPS redirect for /api/expenses
```
⚠️ Une requête HTTP a été reçue et redirigée

### Log avec Blocage IP
```
🚫 Access denied: IP 1.2.3.4 not allowed (allowed: 82.65.136.32)
```
❌ IP non autorisée (sauf si tu veux autoriser d'autres IPs)

## 🎯 Solutions Appliquées

1. **Frontend**: URLs hardcodées HTTPS dans `client.ts`
2. **Backend**: Middleware de redirect HTTP→HTTPS
3. **Backend**: Headers de sécurité stricts (HSTS, CSP)
4. **Backend**: Logs détaillés de toutes les requêtes
5. **Frontend**: Page /debug pour diagnostiquer en temps réel
6. **Scripts**: Outils pour tester et surveiller

Si après tout ça tu vois encore du Mixed Content, partage:
- Screenshot de /debug
- Logs backend (./scripts/view-logs.sh)
- Console navigateur (F12)

Bon courage! 💪
