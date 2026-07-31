# 10 — Versions

Vérifié le **31 juillet 2026**. À revalider à chaque démarrage de phase (V0 → V1 → V2), les versions ci-dessous bougent vite.

## Socle

| Brique | Version | Note |
|---|---|---|
| Node.js | **24 LTS** (« Krypton ») | LTS jusqu'à mai 2028. **Node 20 est EOL depuis avril 2026**, Node 22 tient jusqu'à avril 2027. Fixer dans `.nvmrc`. |
| pnpm | **11.x** | Utiliser les **catalogs** (voir plus bas). |
| Turborepo | **2.10.x** | Champ `tasks` (le `pipeline` de la 1.x est mort depuis longtemps). |
| TypeScript | 5.9+ | Prisma 7 impose un minimum ; Next 16 supporte TS 7 en backport. |

## Applications

| Brique | Version | Note |
|---|---|---|
| Next.js | **16.2.x** | Active LTS jusqu'à oct. 2027. Turbopack par défaut, `middleware.ts` renommé `proxy.ts` — voir ci-dessous. Next 15 est en Maintenance LTS jusqu'à oct. 2026 — ne pas démarrer dessus. |
| React | **19.2.x** | Aligné web et mobile. |
| Hono | **4.12.x** | |
| `@hono/node-server` | **2.0.x** | Adaptateur Node. |
| `@hono/zod-openapi` | **1.5.x** | La 1.0 est la migration Zod v4. |
| Zod | **4.x** | |
| Expo SDK | **57** | Sorti le 30 juin 2026. RN 0.86, React 19.2. Support ~1 an ; SDK 58 attendu vers sept./oct. 2026. |
| React Native | **0.86** | Porté par Expo 57. |

## Données & auth

| Brique | Version | Note |
|---|---|---|
| Prisma ORM | **7.x** | Rupture majeure vs 6 — voir ci-dessous. |
| `@prisma/adapter-pg` | 7.x | **Obligatoire** : `new PrismaClient()` sans adaptateur est invalide en v7. |
| Better Auth | **1.6.x** | |
| `@better-auth/expo` | **1.6.x** | Nécessite `expo-secure-store` **et** `expo-network`. |
| PostgreSQL | 17 | Neon, région UE. |

## Front

| Brique | Version | Note |
|---|---|---|
| TanStack Query | **5.101.x** | |
| Tailwind CSS | **4.x** | Web. Config CSS-first. |
| NativeWind | **v4 stable** (Tailwind 3.x) | ⚠️ voir le point ci-dessous |
| shadcn/ui | courant | Web uniquement. |
| dnd-kit, Recharts, FlashList | courants | |

---

## Ruptures à connaître

### Prisma 7 — la plus grosse

La v7 casse quatre choses par rapport à tout ce qu'on trouve encore dans les tutoriels :

1. **Prisma est désormais un module ES.** `"type": "module"` requis dans le `package.json` du package `db`.
2. **Nouveau générateur, `output` obligatoire.** `provider = "prisma-client"` (et non plus `prisma-client-js`), avec un chemin de sortie explicite. Le client n'est plus généré dans `node_modules`, donc `import { PrismaClient } from "@prisma/client"` ne fonctionne plus.
3. **L'URL sort du schéma.** `url`, `directUrl` et `shadowDatabaseUrl` ne sont plus acceptés dans le bloc `datasource` ; ils vivent dans un `prisma.config.ts` à la racine du package.
4. **Driver adapter obligatoire.** `new PrismaClient()` nu échoue ; il faut passer un adaptateur (`PrismaPg` pour Postgres).

Ont aussi disparu : le middleware client (`$use`), le seed automatique pendant les migrations (il faut lancer `prisma db seed` explicitement), et les métriques.

Configuration cible :

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // pas d'url ici en v7
}
```

```ts
// packages/db/prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
```

```ts
// packages/db/src/client.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
export * from "./generated/prisma/client";
```

**Bonne nouvelle collatérale :** le bug connu entre le générateur `prisma-client` et Turbopack (SSR Next.js 16) ne nous concerne pas, puisque le web ne touche jamais Prisma — seule l'API l'importe. C'est un bénéfice concret de la règle « tout passe par l'API ».

### Next.js 16 — `middleware.ts` devient `proxy.ts`

Turbopack par défaut n'est pas la seule rupture de la 16. Le fichier `middleware.ts` est **déprécié et renommé `proxy.ts`**, pour marquer qu'il s'agit d'une frontière réseau et non d'un middleware applicatif.

- L'export nommé passe de `middleware` à `proxy`.
- Les options de configuration suivent : `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`, `middlewarePrefetch` → `proxyPrefetch`, etc.
- Les types aussi : `NextMiddleware` → `NextProxy`, `MiddlewareConfig` → `ProxyConfig`.
- Le build **avertit** si seul `middleware.ts` existe, et **échoue** si les deux fichiers coexistent.
- **Le runtime `edge` n'est pas supporté par `proxy`** : il tourne en `nodejs`, et ce n'est pas configurable. Un besoin d'edge oblige à rester sur `middleware.ts`.

```ts
// proxy.ts (racine)
export function proxy(request: NextRequest) { /* … */ }
export const config = { matcher: ["/(app)/:path*"] };
```

Migration automatique si l'on part d'un projet existant : `npx @next/codemod middleware-to-proxy .`. Ici on démarre à neuf : écrire directement `proxy.ts`. Ce projet n'a aucun besoin d'edge — la protection des routes `(app)/*` interroge Better Auth côté Node.

### NativeWind et Tailwind 4 — décalage à assumer

Le web est en Tailwind 4. Côté mobile, **NativeWind v5 (qui supporte Tailwind 4) est encore en preview** ; la version stable est la v4, qui fonctionne avec Tailwind 3.x. La chaîne Tailwind 4 sur Expo demande en plus `react-native-css` et une configuration Metro spécifique.

**Décision :** NativeWind v4 + Tailwind 3.x sur le mobile, Tailwind 4 sur le web. Les deux configurations restent séparées de toute façon (aucun composant partagé), donc le décalage ne coûte qu'une chose : ne pas partager le fichier de thème tel quel.

Le contournement propre : définir les **tokens de design** (couleurs, espacements, rayons) dans `packages/config` en TypeScript, et générer les deux configurations Tailwind à partir de cette source unique. Migrer le mobile vers NativeWind v5 quand il sera stable.

### pnpm catalogs

pnpm 11 rend les catalogs incontournables en monorepo : une seule déclaration de version pour tous les packages, ce qui élimine la dérive entre `apps/web` et `apps/mobile`.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  react: 19.2.0
  react-dom: 19.2.0
  zod: ^4.0.0
  "@tanstack/react-query": ^5.101.0
  typescript: ^5.9.0
```

```jsonc
// dans n'importe quel package.json
{ "dependencies": { "zod": "catalog:", "react": "catalog:" } }
```

Cas particulier : les versions des paquets `expo-*` sont pilotées par `npx expo install`, qui les aligne sur le SDK. Ne pas les mettre au catalog, laisser Expo décider.

### Expo et pnpm

Metro a longtemps mal supporté les node_modules symboliques. Si la résolution des packages du workspace échoue depuis `apps/mobile`, le contournement connu est :

```ini
# .npmrc
node-linker=hoisted
```

À tester en V0 avant d'en faire une règle : la situation s'est améliorée côté Metro et pnpm 11, et le mode hoisted a ses propres inconvénients (il annule une partie de l'isolation qui fait l'intérêt de pnpm). Ne l'activer que si le problème se manifeste réellement.

### Node 20 est mort

Sa fin de support est passée en avril 2026. Toute doc ou tutoriel qui la mentionne comme cible est périmé. Next.js 16 exige Node 20+ au minimum, mais viser directement la 24.

## Politique de mise à jour

| Type | Cadence |
|---|---|
| Correctifs de sécurité | immédiat (Dependabot/Renovate en auto-merge si la CI passe) |
| Patchs et mineures | hebdomadaire, groupés |
| Majeures | décision explicite, une PR par majeure, jamais deux en même temps |
| Expo SDK | dans les 2 mois suivant la sortie — le support ne dure qu'environ un an |
| Next.js | rester sur l'Active LTS |

Next.js a eu un cluster d'avis de sécurité en mai 2026 (contournement d'autorisation dans le middleware, SSRF, empoisonnement de cache). C'est une dépendance à tenir à jour sérieusement, pas au fil de l'eau.
