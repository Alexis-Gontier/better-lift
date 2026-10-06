---
paths:
  - ".github/**"
  - "scripts/**"
  - "turbo.json"
  - "vercel.json"
  - "apps/api/src/vercel.ts"
  - "docs/deploiement.md"
---

# CI et déploiement

## CI

- Le check requis par `main` s'appelle **exactement** `Qualité · typecheck · test · build` : c'est
  le `name:` du job dans `.github/workflows/ci.yml`. Les deux bougent ensemble, sinon toute PR
  devient immergeable.
- **La CI n'a pas de base.** Les étapes qui chargent `packages/db/prisma.config.ts` —
  `prisma generate` et `pnpm knip`, elles seules — reçoivent une URL PostgreSQL factice, jamais
  contactée. Toute nouvelle étape qui touche cette configuration en aura besoin aussi.
- **Poser une variable sur une étape ne suffit pas.** Turborepo filtre l'environnement en mode
  strict : une variable absente du bloc `env` de la tâche dans `turbo.json` n'atteint jamais le
  processus. `pnpm test` et `pnpm build` passent par turbo ; `pnpm knip` et `prisma generate`
  sont des appels pnpm directs. Le symptôme — variable visible dans le workflow, absente dans le
  code — ne se reproduit pas en local, où le `.env` la fournit par un autre chemin.

## Déploiement

Procédure complète : [`docs/deploiement.md`](../../docs/deploiement.md).

- Un projet Vercel à la racine, construit au format Build Output API par
  `scripts/construire-vercel.mjs` (l'API en UN bundle esbuild sous `/api`, Better Auth sous
  `/api/auth`). Éprouver en local avec `scripts/essayer-vercel.mjs` avant tout envoi.
- En ligne sur https://better-lift.vercel.app. **Chaque fusion sur `main` déploie la
  production**, chaque PR a sa prévisualisation.
- Le build Vercel n'a **ni `.git` ni `DIRECT_URL`** : `prepare` tolère l'échec de
  `lefthook install`, et le script de build pose une `DIRECT_URL` factice pour
  `prisma generate`. L'essai local, qui a les deux, ne le voit pas.
- **Les migrations partent avec le build de PRODUCTION** (`prisma migrate deploy` en fin de
  `scripts/construire-vercel.mjs`, si `VERCEL_ENV=production`), une fois tout construit. Le build
  lit `DIRECT_URL` (URL directe de `production/betterlift`, variable Vercel de l'environnement
  *Production* seulement) ; absente, il **échoue** plutôt que de déployer un code qui attend une
  table absente (ex. `rateLimit` : toute connexion cassée). Jamais en prévisualisation : une PR
  ouverte migrerait la prod avant sa fusion.
- **Une migration doit rester additive** (colonne nullable, table neuve) : pendant le build,
  l'ancien déploiement tourne déjà sur le nouveau schéma. Renommer ou supprimer se fait en deux
  fusions (ajouter et basculer, puis retirer).
- Base de prod : `betterlift` sur la branche Neon `production`. La console Neon propose `neondb`
  par défaut : **une URL de prod doit finir par `/betterlift`**, sinon l'API tombe sur le schéma
  de la V1 (`column nomFr does not exist`).
- Le web de production appelle `<origine>/api` ; `VITE_API_URL` ne sert qu'en développement.
- Mobile : projet EAS `@algont/better-lift`, APK par `eas build --profile preview` (file gratuite :
  jusqu'à une heure d'attente).
