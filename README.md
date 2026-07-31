# better-lift — Documentation

Tracker de musculation (type Hevy) : application web + application mobile, monorepo TypeScript.

## Stack retenue

| Brique | Choix |
|---|---|
| Runtime | Node 24 LTS |
| Monorepo | pnpm 11 (catalogs) + Turborepo 2.10 |
| Web | Next.js 16 (App Router, Turbopack) + React 19.2 |
| API | Hono 4.12 + `@hono/zod-openapi` 1.5 (runtime Node) |
| Mobile | Expo SDK 57 (RN 0.86) + Expo Router |
| Base de données | PostgreSQL 17 (Neon, région UE) + Prisma 7 |
| Auth | Better Auth 1.6 (web + mobile + API) |
| Validation | Zod 4 |
| Données exercices | [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) |

Versions détaillées et ruptures à connaître : [doc 10](docs/10-versions.md).

## Sommaire

| Doc | Contenu |
|---|---|
| [01 — Produit](docs/01-produit.md) | Vision, personas, périmètre fonctionnel, roadmap V0 → V2 |
| [02 — Architecture](docs/02-architecture.md) | Monorepo, arborescence, packages partagés, déploiement |
| [03 — Modèle de données](docs/03-modele-de-donnees.md) | Schéma Prisma commenté, règles métier |
| [04 — API](docs/04-api.md) | Conventions REST, endpoints, auth, erreurs |
| [05 — App web](docs/05-app-web.md) | Routes, dashboard, éditeur de routines |
| [06 — App mobile](docs/06-app-mobile.md) | Écrans, séance active, offline |
| [07 — Conventions & workflow](docs/07-conventions.md) | Git, CI, env, tests, qualité |
| [08 — Dataset exercices](docs/08-dataset-exercices.md) | Import, mapping, licence |
| [09 — Décisions](docs/09-decisions.md) | Choix tranchés et leurs raisons |
| [10 — Versions](docs/10-versions.md) | Versions épinglées, ruptures Prisma 7 / NativeWind |

## Démarrage rapide (cible V0)

```bash
pnpm install
cp .env.example .env
docker compose up -d          # postgres
pnpm db:migrate && pnpm db:seed   # seed explicite : Prisma 7 ne le lance plus seul
pnpm dev                      # web :3000 · api :3001 · mobile (Expo)
```

## État

| Version | Objectif | Statut |
|---|---|---|
| V0 | Monorepo qui démarre (web + api + mobile) | à faire |
| V1 | Auth, routines, saisie de séance, dashboard | à faire |
| V2 | Stats avancées, mensurations, social, imports | à faire |