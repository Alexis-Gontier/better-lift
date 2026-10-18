# better-lift

Tracker de musculation personnel, web et mobile, en français. Catalogue de 1 316 exercices,
routines série par série, séance guidée sur mobile, historique et records.

En ligne : https://better-lift.vercel.app

## Prérequis

- Node ≥ 24 et pnpm ≥ 11.18
- Une base PostgreSQL (Neon, base `betterlift`)
- Pour le mobile : Android Studio (émulateur) et l'application **Expo Go**

## Démarrer

```
pnpm install
cp .env.example .env          # puis remplir les valeurs
pnpm db:migrate
pnpm db:seed                  # sème le catalogue
pnpm dev                      # API :3001, web :3000, Metro :8081
```

L'inscription est fermée : seules les adresses de `SIGNUP_ALLOWLIST` peuvent créer un compte.

### Mobile sur émulateur

```
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3001 tcp:3001
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

## Structure

| Dossier | Rôle |
|---|---|
| `apps/web` | SPA Vite + React 19, TanStack Router, shadcn/ui |
| `apps/mobile` | Expo SDK 57, Expo Router |
| `apps/api` | Hono + Better Auth ; fonction Vercel en production |
| `packages/db` | Prisma 7 : schéma, migrations, catalogue |
| `packages/shared` | Zod et calculs purs, communs aux trois applications |
| `packages/api-client` | Client typé Hono RPC |

## Qualité

```
pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm knip
```

La CI rejoue la même chaîne sur chaque PR ; `main` n'accepte que des PR fusionnées en squash.

## Documentation

- [Conception](docs/conception.md) — produit, architecture, données, ce qui ne se perd jamais.
- [Registre des décisions](docs/decisions.md) — les choix en vigueur, que le code cite (« D57 »).
- [Système visuel du mobile](DESIGN.md).
- [Déploiement](docs/deploiement.md) — Vercel et APK EAS.
- [`CLAUDE.md`](CLAUDE.md) et [`.claude/rules/`](.claude/rules/) — consignes pour l'agent de code.

Les animations d'exercices appartiennent à © Gym visual et sont affichées depuis le dataset, sans
être copiées dans le dépôt.
