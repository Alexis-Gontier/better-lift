# 02 — Architecture

## Vue d'ensemble

```
┌──────────────┐     ┌──────────────┐
│  apps/web    │     │ apps/mobile  │
│  Next.js 16  │     │  Expo SDK 57 │
└──────┬───────┘     └──────┬───────┘
       │   @better-lift/api-client │
       └────────────┬─────────────┘
                    ▼
            ┌───────────────┐
            │   apps/api    │  Hono 4.12 + Better Auth 1.6
            └───────┬───────┘
                    │ Prisma 7 (adapter-pg)
                    ▼
            ┌───────────────┐
            │  PostgreSQL   │
            └───────────────┘
```

**Une seule source de vérité : l'API.** Le web ne parle pas directement à Postgres, même s'il en aurait techniquement la possibilité via les Server Components. C'est une contrainte volontaire : dès qu'une règle métier existe à deux endroits, elle diverge. Le web et le mobile consomment strictement les mêmes endpoints.

Seule exception tolérée : les Server Components Next.js peuvent appeler l'API en interne (fetch serveur-à-serveur) pour éviter un aller-retour navigateur sur le premier rendu.

## Arborescence

```
better-lift/
├── apps/
│   ├── api/                    # Hono
│   │   ├── src/
│   │   │   ├── index.ts        # bootstrap, middlewares globaux
│   │   │   ├── routes/         # un fichier par ressource
│   │   │   ├── middleware/     # auth, erreurs, logs, rate-limit
│   │   │   ├── services/       # logique métier (aucun accès Hono ici)
│   │   │   └── lib/            # prisma client, auth, config
│   │   └── package.json
│   ├── web/                    # Next.js 16 App Router (Turbopack)
│   │   ├── src/
│   │   │   ├── app/            # routes + fichiers de convention SEULEMENT
│   │   │   │   ├── (marketing)/
│   │   │   │   ├── (auth)/
│   │   │   │   └── (app)/      # zone authentifiée
│   │   │   ├── features/       # découpage par domaine métier
│   │   │   ├── providers/      # providers globaux, un fichier chacun
│   │   │   ├── lib/            # api-client, auth-client, env
│   │   │   └── proxy.ts        # ex-middleware.ts (Next 16)
│   │   └── package.json
│   └── mobile/                 # Expo + Expo Router
│       ├── app/                # routing par fichiers
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   └── store/          # état séance active
│       └── package.json
├── packages/
│   ├── db/                     # Prisma 7 : schéma, prisma.config.ts, migrations, seed, client
│   ├── validators/             # schémas Zod partagés (source de vérité des contrats)
│   ├── core/                   # logique métier pure, sans I/O
│   ├── api-client/             # client typé + hooks TanStack Query
│   ├── ui/                     # primitives shadcn/ui + globals.css — web uniquement, exporté en source (D24)
│   └── config/                 # tsconfig partagés
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc
└── .env.example
```

### Ce qui est partagé, et ce qui ne l'est pas

Le piège classique du monorepo mobile + web est de vouloir partager l'UI. **On ne le fait pas.** `react-native-web` impose un dénominateur commun qui dégrade les deux plateformes, et les interactions d'un éditeur de routines au clavier n'ont rien à voir avec celles d'une saisie de série au doigt.

| Package | Web | Mobile | API | Contenu |
|---|:--:|:--:|:--:|---|
| `core` | ✅ | ✅ | ✅ | Calculs 1RM, volume, conversions kg/lb, agrégations |
| `validators` | ✅ | ✅ | ✅ | Schémas Zod des payloads |
| `api-client` | ✅ | ✅ | — | Fetch typé + hooks React Query |
| `db` | — | — | ✅ | Prisma uniquement |
| `ui` | ✅ | — | — | shadcn/ui (base `radix`, preset `vega`) + la feuille Tailwind 4 |

`packages/core` ne doit **jamais** importer Prisma, React ou une API de plateforme. C'est du TypeScript pur, testable en isolation avec Vitest. Exemples de ce qui y vit :

```ts
estimate1RM(weightKg, reps, formula)      // Epley par défaut
setVolume(set)                            // reps × charge, 0 si échauffement
workoutVolume(workout)
kgToLb(v) / lbToKg(v)
isPersonalRecord(candidate, current)
```

## Contrat de types entre l'API et les clients

Zod est la source unique. `packages/validators` définit les schémas ; l'API les utilise pour valider les entrées, les clients pour typer les réponses.

```ts
// packages/validators/src/routine.ts
export const createRoutineSchema = z.object({
  name: z.string().min(1).max(120),
  folderId: z.string().nullish(),
  exercises: z.array(routineExerciseSchema).min(1),
});
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
```

**Décision (D1) : `@hono/zod-openapi` 1.5.x.** Retenu contre Hono RPC : on obtient un contrat OpenAPI publiable et une doc Swagger gratuite, sans l'inférence TypeScript qui devient pénible passé ~80 routes. La 1.0 de ce package est la migration vers Zod v4 — les deux vont ensemble.

Attention à un détail qui fait perdre du temps : le `z` doit être importé depuis `@hono/zod-openapi`, pas depuis `zod`, sinon la méthode `.openapi()` n'existe pas.

## Choix par application

### API — Hono 4.12

- Runtime **Node 24** via `@hono/node-server` 2.x (pas Cloudflare Workers) : Prisma sur Workers ajoute une complexité sans contrepartie à ce stade.
- **Prisma 7 impose un driver adapter** (`@prisma/adapter-pg`) et le format ES module. Voir doc 10 pour la configuration exacte, elle diffère de tout ce qu'on trouve dans les tutoriels antérieurs à novembre 2025.
- Middlewares : `logger`, CORS strict (origines web et `exp://` en dev), `secureHeaders`, rate limit sur `/auth/*`.
- Découpage : `routes/` fait la validation et l'HTTP, `services/` porte la logique. Un service ne connaît jamais le contexte Hono, ce qui le rend testable directement.
- Better Auth est monté sur `/api/auth/*` et expose un handler compatible Hono.

### Web — Next.js 16

- App Router, Server Components par défaut, `"use client"` uniquement pour l'interactif (éditeur de routines, formulaires).
- Turbopack est le bundler par défaut depuis la 16 : ne pas repartir d'une configuration webpack.
- TanStack Query 5 pour l'état serveur côté client, `dnd-kit` pour le glisser-déposer, `Recharts` pour les graphiques.
- shadcn/ui (base **`radix`**, preset **`vega`**) + **Tailwind 4** (configuration CSS-first). Les primitives et `globals.css` vivent dans `packages/ui`, qui **n'a pas d'étape de build** : Next transpile ses `.tsx` (D24). Les composants métier restent dans `apps/web/src/features/<domaine>`.
- `shadcn add` se lance depuis `apps/web` (`-c apps/web`) : c'est là qu'est le `components.json` qui route les primitives vers `packages/ui`.
- `proxy.ts` pour la protection des routes `(app)/*` — en Next 16 ce fichier remplace `middleware.ts` (voir doc 10).

### Mobile — Expo SDK 57

- Expo Router (routing par fichiers, cohérent avec Next).
- **Development build** (pas Expo Go) : Better Auth, le stockage sécurisé et MMKV nécessitent du natif.
- Stockage : `expo-secure-store` pour la session, `react-native-mmkv` pour l'état de séance active (rapide, synchrone).
- **NativeWind v4 + Tailwind 3.x** côté mobile, alors que le web est en Tailwind 4 : NativeWind v5 (compatible Tailwind 4) est encore en preview. Décalage assumé, voir doc 10 pour le contournement par tokens partagés.
- Le support d'un SDK Expo dure environ un an. SDK 58 attendu vers septembre/octobre 2026 — prévoir la montée de version dans le planning plutôt que de la subir.
- Distribution via EAS Build + EAS Update pour les correctifs JS sans passer par les stores.

## Gotchas connus

**pnpm + Expo.** Metro a historiquement mal supporté les node_modules symboliques ; le contournement connu est `node-linker=hoisted` dans `.npmrc`. La situation s'est améliorée avec pnpm 11 et les versions récentes de Metro : **tester d'abord sans**, et n'activer le mode hoisted que si la résolution échoue réellement — il annule une partie de l'isolation qui fait l'intérêt de pnpm. C'est le premier point à valider en V0.

**Versions dans un monorepo.** Utiliser les **pnpm catalogs** pour déclarer React, Zod, TanStack Query et TypeScript en un seul endroit. Sans ça, `apps/web` et `apps/mobile` divergent en quelques semaines. Exception : les paquets `expo-*`, dont les versions sont pilotées par `npx expo install` en fonction du SDK — les laisser hors catalog.

**URL de l'API depuis un téléphone physique.** `localhost` pointe sur le téléphone, pas sur la machine de dev. Utiliser l'IP LAN via `EXPO_PUBLIC_API_URL`, ou un tunnel. À documenter dans le README, sinon la question reviendra.

**Cookies cross-origin.** Better Auth en mode cookie exige `SameSite=None; Secure` et un CORS avec `credentials: true` si le web et l'API sont sur des domaines différents. Deux façons de l'éviter : servir l'API sous `api.better-lift.app` (même site parent), ou passer le web en mode bearer token comme le mobile. Le sous-domaine est plus propre.

**Prisma 7 en monorepo.** Le chemin `output` est désormais **obligatoire** dans le bloc `generator`, et le client n'est plus généré dans `node_modules` : le générer dans `packages/db/src/generated/prisma` et le réexporter depuis l'index du package. Le package `db` doit passer en `"type": "module"`. Détail complet en doc 10.

## Turborepo

```jsonc
// turbo.json
{
  "tasks": {
    "build":    { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev":      { "cache": false, "persistent": true },
    "lint":     { "dependsOn": ["^build"] },
    "typecheck":{ "dependsOn": ["^build"] },
    "test":     { "dependsOn": ["^build"] },
    "db:generate": { "cache": false }
  }
}
```

`packages/db` doit exposer un script `build` qui lance `prisma generate`, sinon les autres packages compilent contre un client absent au premier build en CI. Prisma 7 ayant supprimé le `generate` implicite, cette étape n'est plus optionnelle.

## Environnements et déploiement

| Environnement | Web | API | Base | Mobile |
|---|---|---|---|---|
| Local | `:3000` | `:3001` | Neon (branche de dev) | Expo dev client |
| Preview | Vercel (par PR) | Railway (par PR) | Neon branch | EAS preview channel |
| Production | Vercel | Railway / Fly.io | Neon (région UE) | Stores + EAS Update |

**Neon, région UE** (D4). Les branches de base par PR valent largement leur coût pendant le développement, et la région couvre l'exigence RGPD.

### Variables d'environnement

```bash
# Base (lue par prisma.config.ts en v7, plus par schema.prisma)
DATABASE_URL="postgresql://…@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://…@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# API
PORT=3001
NODE_ENV=development
CORS_ORIGINS="http://localhost:3000,exp://192.168.1.10:8081"

# Better Auth
BETTER_AUTH_SECRET="..."          # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3001"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# Web
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Mobile
EXPO_PUBLIC_API_URL="http://192.168.1.10:3001"

# Médias
MEDIA_BASE_URL="https://cdn.better-lift.app"
```

Valider la configuration au démarrage avec Zod (`packages/config` ou un `env.ts` par app) : un crash immédiat au boot vaut mieux qu'un `undefined` qui se propage en production.
