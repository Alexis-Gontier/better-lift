# Déployer better-lift

Un seul projet Vercel sert le web et l'API sur la **même origine** (D18) : le web à la racine,
l'API sous `/api`, Better Auth sous `/api/auth`. Le mobile est un **APK EAS** installé à la main.
Aucun secret ne passe par le dépôt ni par l'agent : ils se saisissent dans Neon, Vercel et EAS.

## Ce qui est déjà fait

- La base **`betterlift` existe sur la branche Neon `production`** (vide), à côté de `neondb` qui
  porte la V1 et reste intacte.
- `vercel.json` et `scripts/construire-vercel.mjs` produisent le déploiement au format
  « Build Output API ». Il a été **éprouvé en local** (voir la fin de ce document).
- `apps/mobile/eas.json` porte un profil `preview` qui produit un APK.

## 1. Remplir la base de production

Dans la console Neon, branche **`production`**, base **`betterlift`** : copier l'URL **directe**
et l'URL **poolée** (celle qui contient `-pooler`). Puis, depuis la racine du dépôt, en
PowerShell :

```powershell
$env:DIRECT_URL   = "postgresql://…directe…/betterlift?sslmode=require"
$env:DATABASE_URL = "postgresql://…-pooler…/betterlift?sslmode=require"
pnpm --filter @better-lift/db exec prisma migrate deploy
pnpm db:seed
Remove-Item Env:DIRECT_URL, Env:DATABASE_URL
```

Attendu : cinq migrations appliquées, puis `Catalogue semé : 1316 exercices.` Les variables
posées dans le terminal l'emportent sur le `.env`, qui continue de viser `dev`.

Ensuite, les migrations n'ont plus à être lancées à la main : chaque build de production les
applique (voir `DIRECT_URL` ci-dessous). Le semis du catalogue, lui, reste manuel.

## 2. Déployer sur Vercel

```powershell
npx vercel link            # une fois : crée ou relie le projet, à la RACINE du dépôt
```

Dans les réglages du projet (**Settings → Environment Variables**, environnement *Production*) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | l'URL **poolée** de `production/betterlift` |
| `DIRECT_URL` | l'URL **directe** de `production/betterlift` (sans `-pooler`) — environnement *Production* SEUL : le build de production l'utilise pour `prisma migrate deploy` |
| `BETTER_AUTH_SECRET` | un secret **neuf** : `openssl rand -base64 32` — jamais celui du dev |
| `BETTER_AUTH_URL` | `https://<ton-domaine>` (sans `/api`) |
| `SIGNUP_ALLOWLIST` | les adresses autorisées, séparées par des virgules, sans espace |

Puis :

```powershell
npx vercel deploy --prod
```

Vérifier : `https://<ton-domaine>/api/health` rend `"db":true`, et la page d'accueil s'affiche.
Créer ensuite les comptes par le web (« Créer un compte ») : la liste blanche filtre.

> `BETTER_AUTH_URL` dépend du domaine, connu au premier déploiement. Si le domaine change,
> mettre la variable à jour et redéployer.

## 3. Construire l'APK

```powershell
cd apps/mobile
npx eas login
npx eas init                                   # une fois : attache le projet EAS
npx eas env:create --name EXPO_PUBLIC_API_URL --value "https://<ton-domaine>/api" --environment preview --visibility plaintext
npx eas build --platform android --profile preview
```

Le build tourne dans le cloud EAS (~15 min) et rend un lien vers l'APK : l'ouvrir sur le
téléphone et l'installer. Les artefacts EAS expirent au bout de quatorze jours.

> `EXPO_PUBLIC_API_URL` porte **`/api`** ; l'authentification en déduit l'origine elle-même
> (`apps/mobile/lib/config.ts`).

## Éprouver le déploiement en local, avant de l'envoyer

```powershell
node scripts/construire-vercel.mjs
$env:BETTER_AUTH_URL = "http://localhost:4000"; node --env-file=.env scripts/essayer-vercel.mjs
```

Puis `http://localhost:4000` : c'est le déploiement tel qu'il partira, routage compris, branché
sur la base de `dev`.
