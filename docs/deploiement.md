# Déployer better-lift

Un seul projet Vercel sert le web et l'API sur la **même origine** : le SPA sous `/app`, l'API
sous `/api`, Better Auth sous `/api/auth` ; la racine redirige (307) vers `/app` en attendant une
landing. Le mobile est un **APK EAS** installé à la main. Aucun secret ne passe par le dépôt ni
par l'agent : ils se saisissent dans Neon, Vercel et EAS.

En ligne : https://better-lift.vercel.app

## Web et API

**Chaque fusion sur `main` déploie la production** ; chaque PR a sa prévisualisation. Le build
(`scripts/construire-vercel.mjs`) produit le format Build Output API : l'API en un bundle
esbuild, le SPA copié dans `static/app`.

**Les migrations partent avec le build de production** (`prisma migrate deploy` en fin de build,
si `VERCEL_ENV=production`). Une migration doit donc rester **additive** : pendant le build,
l'ancien déploiement tourne déjà sur le nouveau schéma. Renommer ou supprimer se fait en deux
fusions (ajouter et basculer, puis retirer). Le semis du catalogue, lui, reste manuel.

Variables du projet Vercel (*Settings → Environment Variables*, environnement *Production*) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL **poolée** (`-pooler`) de `production/betterlift` |
| `DIRECT_URL` | URL **directe** de `production/betterlift` — *Production* seul : le build migre avec. Absente, le build échoue plutôt que de déployer un code qui attend une table absente |
| `BETTER_AUTH_SECRET` | un secret propre à la prod (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `https://better-lift.vercel.app` (sans `/api`) |
| `SIGNUP_ALLOWLIST` | adresses autorisées, séparées par des virgules, sans espace |

> **Une URL de prod doit finir par `/betterlift`.** La console Neon propose `neondb`, qui porte
> la V1 : l'API tomberait sur l'ancien schéma (`column nomFr does not exist`).

### Semer le catalogue de production

Après un changement de `noms-fr.json` ou du dataset, depuis la racine, en PowerShell :

```powershell
$env:DIRECT_URL   = "postgresql://…directe…/betterlift?sslmode=require"
$env:DATABASE_URL = "postgresql://…-pooler…/betterlift?sslmode=require"
pnpm db:seed
Remove-Item Env:DIRECT_URL, Env:DATABASE_URL
```

Les variables du terminal l'emportent sur le `.env`, qui continue de viser `dev`. Le semis est
rejouable (`upsert` sur le slug).

### Éprouver le déploiement en local

```powershell
node scripts/construire-vercel.mjs
$env:BETTER_AUTH_URL = "http://localhost:4000"; node --env-file=.env scripts/essayer-vercel.mjs
```

Puis `http://localhost:4000` : le déploiement tel qu'il partira, routage et redirection de la
racine compris, branché sur la base de `dev`.

## Mobile (EAS)

Projet EAS `@algont/better-lift`, depuis `apps/mobile` :

```powershell
npx eas build --platform android --profile preview
```

Le build tourne dans le cloud (file gratuite : jusqu'à une heure d'attente, ~15 min de build) et
rend un lien vers l'APK, universel (installable aussi sur l'émulateur x86_64). Les artefacts
expirent au bout de quatorze jours.

- Chaque profil (`preview`, `production`) lit l'environnement EAS du même nom :
  `EXPO_PUBLIC_API_URL` (`https://better-lift.vercel.app/api`) doit y exister, sinon l'app vise
  `10.0.2.2`. L'authentification en déduit l'origine (`apps/mobile/lib/config.ts`).
- Un correctif JS part par `eas update --channel <canal>` sans nouvel APK, vers les builds de même
  `version`. Une dépendance native ajoutée ou un SDK changé : monter `version` et refaire un
  build.
