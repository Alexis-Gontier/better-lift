# better-lift — Documentation

Tracker de musculation (type Hevy) : application web + application mobile, monorepo TypeScript.

## Stack retenue

| Brique            | Choix                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Runtime           | Node 24 LTS                                                                       |
| Monorepo          | pnpm 11 (catalogs) + Turborepo 2.10                                               |
| Web               | Next.js 16 (App Router, Turbopack) + React 19.2                                   |
| API               | Hono 4.12 + `@hono/zod-openapi` 1.5 (runtime Node)                                |
| Mobile            | Expo SDK 57 (RN 0.86) + Expo Router                                               |
| Base de données   | PostgreSQL 18 (Neon, Francfort) + Prisma 7                                        |
| Auth              | Better Auth 1.6 (web + mobile + API)                                              |
| Validation        | Zod 4                                                                             |
| Qualité           | Biome 2.5 (format + lint), Lefthook 2.1 (hooks), Knip 6 (code mort)               |
| Données exercices | [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) |

Versions détaillées et ruptures à connaître : [doc 10](docs/10-versions.md).

## Sommaire

| Doc                                                    | Contenu                                                  |
| ------------------------------------------------------ | -------------------------------------------------------- |
| [01 — Produit](docs/01-produit.md)                     | Vision, personas, périmètre fonctionnel, roadmap V0 → V2 |
| [02 — Architecture](docs/02-architecture.md)           | Monorepo, arborescence, packages partagés, déploiement   |
| [03 — Modèle de données](docs/03-modele-de-donnees.md) | Schéma Prisma commenté, règles métier                    |
| [04 — API](docs/04-api.md)                             | Conventions REST, endpoints, auth, erreurs               |
| [05 — App web](docs/05-app-web.md)                     | Routes, dashboard, éditeur de routines                   |
| [06 — App mobile](docs/06-app-mobile.md)               | Écrans, séance active, offline                           |
| [07 — Conventions & workflow](docs/07-conventions.md)  | Git, CI, env, tests, qualité                             |
| [08 — Dataset exercices](docs/08-dataset-exercices.md) | Import, mapping, licence                                 |
| [09 — Décisions](docs/09-decisions.md)                 | Choix tranchés et leurs raisons                          |
| [10 — Versions](docs/10-versions.md)                   | Versions épinglées, ruptures Prisma 7 / NativeWind       |

## Démarrage rapide

Prérequis : **Node 24** (`.nvmrc`), **pnpm 11**.

```bash
pnpm install
cp .env.example .env          # renseigner DATABASE_URL et DIRECT_URL (Neon)
pnpm db:migrate && pnpm db:seed   # seed explicite : Prisma 7 ne le lance plus seul
pnpm dev                      # web :3000 · api :3001 · mobile (Expo)
```

La base de développement est **Neon, région Francfort** (D4), sans repli local : pour isoler
un essai ou éprouver une migration, créer une branche Neon plutôt qu'une base à part.

### Variables d'environnement

| Variable              | Utilisée par | Rôle                                                              |
| --------------------- | ------------ | ----------------------------------------------------------------- |
| `DATABASE_URL`        | api, db      | Connexion **poolée** Neon (`-pooler`), utilisée au runtime        |
| `DIRECT_URL`          | db           | Connexion **directe**, utilisée par les migrations. Vide en local |
| `PORT`                | api          | 3001 par défaut                                                   |
| `CORS_ORIGINS`        | api          | Origines autorisées, séparées par des virgules. Jamais `*`        |
| `APP_VERSION`         | api          | Version renvoyée par `/health`, injectée par la CI                |
| `MEDIA_BASE_URL`      | db (seed)    | Préfixe CDN des médias d'exercices. Sans elle, chemins relatifs   |
| `NEXT_PUBLIC_API_URL` | web          | `http://localhost:3001`                                           |

`EXPO_PUBLIC_API_URL` ne vit **pas** dans ce fichier — voir ci-dessous.

### Mobile

**Expo ne lit que `apps/mobile/.env`, jamais celui de la racine.** Une variable `EXPO_PUBLIC_*`
placée à la racine est ignorée sans le moindre avertissement : le bundle retombe silencieusement
sur la valeur de repli du code. Copier `apps/mobile/.env.example` vers `apps/mobile/.env`.

| Cible              | `EXPO_PUBLIC_API_URL`                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Téléphone physique | `http://<IP-LAN-de-la-machine>:3001` — `localhost` désignerait le téléphone |
| Émulateur Android  | `http://10.0.2.2:3001`                                                      |
| Simulateur iOS     | `http://localhost:3001`                                                     |

Après modification de ce fichier, **relancer Metro avec `--clear`** : le cache conserve les valeurs
inlinées de l'exécution précédente et masque le changement.

En V0, l'application ne dépend d'aucun module natif absent d'Expo Go : elle s'y lance telle quelle.
Le **development build devient obligatoire en V1** (Better Auth, SecureStore, MMKV — doc 06).

Development build obligatoire, jamais Expo Go (doc 06). Pour vérifier que Metro résout bien les
packages du workspace sans lancer d'appareil :

```bash
pnpm --filter mobile exec expo export --platform android --output-dir .expo/check
```

## État

| Version | Objectif                                      | Statut         |
| ------- | --------------------------------------------- | -------------- |
| V0      | Monorepo qui démarre (web + api + mobile)     | socle en place |
| V1      | Auth, routines, saisie de séance, dashboard   | à faire        |
| V2      | Stats avancées, mensurations, social, imports | à faire        |
