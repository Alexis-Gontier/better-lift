# better-lift — Lots 0 à 2 : socle et interface

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**But :** monter le monorepo, poser la coquille web à trois panneaux, et dessiner les trois écrans principaux sur données factices — sans écrire une ligne d'API métier.

**Architecture :** monorepo pnpm + Turborepo. Trois applications (`web` en SPA Vite, `mobile` Expo, `api` Hono) et trois paquets (`db` Prisma, `shared` Zod et calculs purs, `api-client`). Le web et le mobile passent tous deux par l'API. `packages/shared` reste du TypeScript pur, sans Prisma ni React.

**Pile :** Vite 8, React 19, TanStack Router + Query, shadcn/ui sur Tailwind 4, Hono 4, Prisma 7 sur Neon, Expo SDK 57, Biome, Vitest.

**Spec :** [`docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md`](../specs/2026-09-22-better-lift-redemarrage-design.md) — le plan argumente depuis la spec ; lire les deux.

## Contraintes globales

Ces règles s'appliquent à **toutes** les tâches, sans être répétées.

- **Node ≥ 24** (local : 24.18.1). **pnpm 11.27.1** exactement, pinné par `packageManager`. La machine a actuellement **11.13.0, une *broken release* marquée par l'amont** : elle doit être remplacée avant la tâche 1.
- **Pas de pnpm 12** : la branche 12 existe mais n'a jamais été éprouvée avec Metro sur ce projet, et c'est précisément le point que la V0 de l'ancien projet avait dû valider. Le passage en 12 est un chantier à part.
- **Versions exactes** (relevées le 2026-09-22) : `vite@8.3.0`, `react@19.3.0`, `@vitejs/plugin-react@6.1.1`, `@tanstack/react-router@1.170.38`, `@tanstack/router-plugin@1.168.40`, `@tanstack/react-query@5.103.2`, `hono@4.13.8`, `@hono/node-server@2.1.1`, `@prisma/client@7.10.0`, `@prisma/adapter-pg@7.10.0`, `better-auth@1.7.5`, `tailwindcss@4.3.3`, `zod@4.6.5`, `@biomejs/biome@2.5.14`, `turbo@2.11.2`, `vitest@5.0.1`, `typescript@7.0.2`, `expo@57.0.24`, `lefthook@2.1.14`, `knip@6.37.0`.
- **Toute l'interface est en français.** Aucun mécanisme d'i18n (D14).
- **Le lime sourd `#a8cf45` est la seule couleur.** L'action est un **aplat**, le record un **contour** avec flèche montante (D28). Jamais de couleur en dur : un token par rôle, deux valeurs par token (D29).
- **Ni Biome ni Knip ne touchent `.claude/`** : des skills y embarquent des `.mjs` dont la réécriture ferait diverger le hash de `skills-lock.json`.
- **Ne jamais pousser sur `main` directement.** Une branche `feat/lot-N-<sujet>` par lot.
- Commits en **Conventional Commits, en français**.

---

# LOT 0 — Socle

**Critère de sortie :** `pnpm dev` lance les trois applications, le web et le mobile affichent tous deux l'état de l'API, et la CI est verte.

---

### Tâche 1 : Racine du monorepo et outillage

**Fichiers :**
- Créer : `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `knip.json`, `lefthook.yml`, `commitlint.config.js`
- Créer : `packages/config/tsconfig.base.json`, `packages/config/package.json`

**Interfaces :**
- Consomme : rien
- Produit : les scripts racine `dev`, `build`, `typecheck`, `test`, `lint`, `knip` ; le tsconfig de base `@better-lift/config/tsconfig.base.json` dont tout paquet hérite.

- [ ] **Étape 1 : Remplacer la pnpm cassée**

```bash
corepack enable
corepack prepare pnpm@11.27.1 --activate
pnpm --version
```

Attendu : `11.27.1`. Si la commande sort en `ERR_PNPM_BROKEN_PNPM_RELEASE`, c'est que la 11.13.0 est encore active — relancer `corepack prepare` puis rouvrir le terminal.

- [ ] **Étape 2 : Créer la branche**

```bash
git checkout -b feat/lot-0-socle
```

- [ ] **Étape 3 : Écrire `package.json` à la racine**

```json
{
  "name": "better-lift",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.27.1",
  "engines": { "node": ">=24.0.0" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "lint:ci": "biome ci .",
    "knip": "knip",
    "db:generate": "pnpm --filter @better-lift/db run generate",
    "db:migrate": "pnpm --filter @better-lift/db run migrate",
    "db:seed": "pnpm --filter @better-lift/db run seed",
    "prepare": "lefthook install"
  },
  "devDependencies": {
    "@biomejs/biome": "2.5.14",
    "@commitlint/cli": "^21.2.1",
    "@commitlint/config-conventional": "^21.2.0",
    "knip": "6.37.0",
    "lefthook": "2.1.14",
    "turbo": "2.11.2",
    "typescript": "7.0.2"
  }
}
```

- [ ] **Étape 4 : Écrire `pnpm-workspace.yaml`**

Le catalog centralise les versions partagées. `allowBuilds` doit être explicite : un script d'installation laissé en suspens fait sortir `pnpm install` en erreur et bloque `pnpm exec`.

```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  typescript: 7.0.2
  vitest: 5.0.1
  "@biomejs/biome": 2.5.14
  react: 19.3.0
  react-dom: 19.3.0
  "@types/react": ^19.3.0
  "@types/react-dom": ^19.3.0

allowBuilds:
  "@biomejs/biome": true
  esbuild: true
  lefthook: true
  "@prisma/client": true
  "@prisma/engines": true
  prisma: true
```

> **`allowBuilds` est une map `matcher: booléen`, jamais une liste.** La forme liste appartient à l'ancienne clé `onlyBuiltDependencies`, qu'`allowBuilds` remplace depuis pnpm 10.26. Écrite en liste, la clé est sérialisée en tableau, et une approbation ultérieure la transforme en objet à clés numériques `'0'`, `'1'`… : plus aucun nom de paquet n'est alors reconnu, et `ERR_PNPM_IGNORED_BUILDS` revient dès qu'une dépendance à script d'installation entre dans l'arbre.
>
> Ne jamais éditer `allowBuilds` à la main sans relire le fichier ensuite : `pnpm approve-builds` y réécrit ses décisions, et une forme invalide au départ ressort corrompue.

- [ ] **Étape 5 : Écrire `turbo.json`**

Pas de tâche `lint` : Biome tourne depuis la racine (D7).

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".output/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Étape 6 : Écrire `biome.json`**

L'exclusion de `.claude` est obligatoire — voir les contraintes globales.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.14/schema.json",
  "files": {
    "includes": ["**", "!**/dist", "!**/.turbo", "!**/node_modules", "!.claude", "!**/.expo"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "javascript": {
    "formatter": { "quoteStyle": "double", "semicolons": "always" }
  }
}
```

- [ ] **Étape 7 : Écrire `knip.json`**

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "ignore": [".claude/**"],
  "workspaces": {
    ".": { "entry": [], "project": [] },
    "packages/*": { "entry": "src/index.ts", "project": "src/**/*.ts" },
    "apps/api": { "entry": "src/index.ts", "project": "src/**/*.ts" },
    "apps/web": { "entry": "src/main.tsx", "project": "src/**/*.{ts,tsx}" }
  }
}
```

- [ ] **Étape 8 : Écrire `lefthook.yml` et `commitlint.config.js`**

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json,jsonc,css}"
      exclude: ".claude/**"
      run: pnpm exec biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true

commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}
```

```js
export default { extends: ["@commitlint/config-conventional"] };
```

- [ ] **Étape 9 : Écrire `packages/config/`**

`packages/config/package.json` :

```json
{
  "name": "@better-lift/config",
  "version": "0.0.0",
  "private": true,
  "files": ["tsconfig.base.json"]
}
```

`packages/config/tsconfig.base.json` :

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Étape 10 : Installer et vérifier**

```bash
pnpm install
pnpm lint
```

Attendu : installation sans erreur, Biome sans plainte. Si `pnpm install` se plaint d'un script d'installation ignoré, ajouter le paquet concerné à `allowBuilds` — **en relisant le YAML après**.

- [ ] **Étape 11 : Commit**

```bash
git add -A
git commit -m "chore: socle du monorepo — pnpm, turborepo, biome, knip, lefthook"
```

---

### Tâche 2 : `packages/shared` — calculs purs en TDD

**Fichiers :**
- Créer : `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/vitest.config.ts`
- Créer : `packages/shared/src/index.ts`, `packages/shared/src/training.ts`, `packages/shared/src/units.ts`
- Test : `packages/shared/src/training.test.ts`, `packages/shared/src/units.test.ts`

**Interfaces :**
- Consomme : `@better-lift/config`
- Produit :
  - `estimate1RM(weightKg: number, reps: number): number` — Epley, arrondi à 0,1
  - `setVolume(set: { weightKg: number; reps: number; type: SetType }): number`
  - `type SetType = "warmup" | "normal" | "dropset" | "failure"`
  - `kgToLb(kg: number): number`, `lbToKg(lb: number): number`
  - `type UnitSystem = "metric" | "imperial"`

- [ ] **Étape 1 : Créer le paquet**

`packages/shared/package.json` :

```json
{
  "name": "@better-lift/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf .turbo node_modules"
  },
  "devDependencies": {
    "@better-lift/config": "workspace:*",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

`packages/shared/tsconfig.json` :

```json
{
  "extends": "@better-lift/config/tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src/**/*.ts"]
}
```

`packages/shared/vitest.config.ts` :

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Étape 2 : Écrire le test qui échoue — 1RM**

`packages/shared/src/training.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { estimate1RM, setVolume } from "./training.js";

describe("estimate1RM", () => {
  it("rend la charge elle-même à une seule répétition", () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it("applique la formule d'Epley au-delà d'une répétition", () => {
    // Epley : poids × (1 + reps / 30) → 100 × (1 + 5/30) = 116,666…
    expect(estimate1RM(100, 5)).toBe(116.7);
  });

  it("rend 0 pour zéro répétition", () => {
    expect(estimate1RM(100, 0)).toBe(0);
  });
});

describe("setVolume", () => {
  it("multiplie la charge par les répétitions", () => {
    expect(setVolume({ weightKg: 80, reps: 8, type: "normal" })).toBe(640);
  });

  it("ignore les séries d'échauffement", () => {
    expect(setVolume({ weightKg: 40, reps: 10, type: "warmup" })).toBe(0);
  });

  it("compte les séries dégressives et à l'échec", () => {
    expect(setVolume({ weightKg: 50, reps: 6, type: "dropset" })).toBe(300);
    expect(setVolume({ weightKg: 50, reps: 4, type: "failure" })).toBe(200);
  });
});
```

- [ ] **Étape 3 : Lancer le test pour vérifier qu'il échoue**

```bash
pnpm --filter @better-lift/shared exec vitest run src/training.test.ts
```

Attendu : ÉCHEC — `Failed to resolve import "./training.js"`.

- [ ] **Étape 4 : Écrire l'implémentation minimale**

`packages/shared/src/training.ts` :

```ts
export type SetType = "warmup" | "normal" | "dropset" | "failure";

/**
 * 1RM estimé par la formule d'Epley (D4) : poids × (1 + reps / 30).
 * Arrondi à la décimale — au-delà, la précision est illusoire.
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/** Le volume d'une série. Un échauffement ne compte pas. */
export function setVolume(set: { weightKg: number; reps: number; type: SetType }): number {
  if (set.type === "warmup") return 0;
  return set.weightKg * set.reps;
}
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il passe**

```bash
pnpm --filter @better-lift/shared exec vitest run src/training.test.ts
```

Attendu : 6 tests verts.

- [ ] **Étape 6 : Écrire le test qui échoue — unités**

`packages/shared/src/units.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { kgToLb, lbToKg } from "./units.js";

describe("conversions", () => {
  it("convertit les kilogrammes en livres", () => {
    expect(kgToLb(100)).toBe(220.46);
  });

  it("convertit les livres en kilogrammes", () => {
    expect(lbToKg(220.46)).toBe(100);
  });

  it("fait l'aller-retour sans dériver", () => {
    expect(lbToKg(kgToLb(60))).toBe(60);
  });
});
```

- [ ] **Étape 7 : Vérifier l'échec, puis implémenter**

```bash
pnpm --filter @better-lift/shared exec vitest run src/units.test.ts
```

Attendu : ÉCHEC. Puis `packages/shared/src/units.ts` :

```ts
export type UnitSystem = "metric" | "imperial";

const LB_PAR_KG = 2.2046226218;

/** Arrondi à 0,01 : deux décimales suffisent pour une charge. */
export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PAR_KG * 100) / 100;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / LB_PAR_KG) * 100) / 100;
}
```

- [ ] **Étape 8 : Écrire le point d'entrée**

`packages/shared/src/index.ts` :

```ts
export { estimate1RM, setVolume, type SetType } from "./training.js";
export { kgToLb, lbToKg, type UnitSystem } from "./units.js";
```

- [ ] **Étape 9 : Vérifier l'ensemble**

```bash
pnpm --filter @better-lift/shared test
pnpm --filter @better-lift/shared typecheck
```

Attendu : 9 tests verts, aucune erreur de typage.

- [ ] **Étape 10 : Commit**

```bash
git add packages/shared
git commit -m "feat(shared): 1RM Epley, volume de série et conversions d'unités"
```

---

### Tâche 3 : `packages/db` — Prisma 7 sur Neon, catalogue aplati

**Fichiers :**
- Créer : `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/prisma.config.ts`
- Créer : `packages/db/prisma/schema.prisma`, `packages/db/src/index.ts`
- Créer : `.env` (non commité), à partir de `.env.example`

**Interfaces :**
- Consomme : `@better-lift/config`
- Produit : `prisma` — une instance `PrismaClient` mise en cache sur `globalThis` hors production.

> **Prisma 7 impose un driver adapter et le format ES module.** La configuration diffère de tous les tutoriels antérieurs à novembre 2025.

- [ ] **Étape 1 : Vérifier que la base est joignable**

Le `.env` est **déjà en place** à la racine, et la branche Neon `dev` est réactivée.

Un point à connaître plutôt qu'à redécouvrir : cette branche porte toujours les quinze tables du schéma de la V1 — `ExerciseTranslation`, `PersonalRecord`, `RoutineFolder` et les tables de Better Auth. Un `prisma migrate dev` lancé contre elles détecterait une dérive et proposerait une réinitialisation destructive.

C'est pourquoi le nouveau développement vise une **base distincte, `betterlift`**, créée vide sur la même branche. L'ancienne `neondb` reste intacte à côté, et le catalogue de `production` n'est pas concerné. Les deux URL du `.env` pointent déjà sur `betterlift`.

```bash
node -e "console.log(process.env.DATABASE_URL?.includes('/betterlift') ? 'ok' : 'MAUVAISE BASE')" --env-file=.env
```

Attendu : `ok`. Si la sortie dit autre chose, arrête-toi et signale-le — ne migre pas contre `neondb`.

- [ ] **Étape 2 : Créer le paquet**

`packages/db/package.json` :

```json
{
  "name": "@better-lift/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "generate": "prisma generate",
    "migrate": "prisma migrate dev",
    "studio": "prisma studio",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo node_modules src/generated"
  },
  "dependencies": {
    "@prisma/adapter-pg": "7.10.0",
    "@prisma/client": "7.10.0"
  },
  "devDependencies": {
    "@better-lift/config": "workspace:*",
    "prisma": "7.10.0",
    "typescript": "catalog:"
  }
}
```

- [ ] **Étape 3 : Écrire `prisma.config.ts`**

> **Deux ruptures de Prisma 7 que tous les tutoriels antérieurs ignorent.** D'abord, `url` et `directUrl` **ne sont plus acceptés dans `schema.prisma`** : les y laisser fait échouer toute commande sur un `P1012`. Ils vivent désormais ici. Ensuite, **Prisma 7 ne charge plus le `.env` tout seul** — il faut le faire explicitement, et le nôtre est à la racine du monorepo, deux niveaux au-dessus de ce fichier. `process.loadEnvFile()` est natif à Node 24 et évite d'ajouter `dotenv`.

> **Troisième piège, le plus sournois : `url` reçoit ici l'URL DIRECTE, pas la poolée.** En Prisma 7, le CLI n'utilise que `url` pour migrer — `directUrl` n'est plus honoré dans ce contexte. Y mettre `DATABASE_URL` ferait passer les migrations par le pooler, exactement ce que la convention du projet veut éviter : PgBouncer en mode transaction fait échouer une migration qui tient un verrou consultatif sur plusieurs instructions. Un lot de `CREATE` passe quand même, ce qui rend le défaut invisible jusqu'à la première migration complexe.
>
> Le découplage est le suivant : **le CLI migre par la connexion directe, le runtime interroge par le pooler.** `src/index.ts` lit `DATABASE_URL` de son côté, indépendamment de ce fichier.

```ts
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, "../../.env");

// Le garde compte : en CI et sur Vercel, les variables sont injectées dans
// l'environnement et aucun `.env` n'existe sur disque. Sans lui,
// `loadEnvFile` jette un ENOENT et casse le build avec un message obscur.
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // L'URL DIRECTE : c'est cette clé que le CLI utilise pour migrer.
    url: env("DIRECT_URL"),
  },
});
```

- [ ] **Étape 4 : Écrire le schéma**

Le catalogue est **aplati** (D20) : pas de table de traductions, `name` et `instructions` portés par `Exercise`.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated"
}

datasource db {
  provider = "postgresql"
  // url et directUrl vivent dans prisma.config.ts (Prisma 7).
}

enum BodyPart {
  CHEST
  BACK
  SHOULDERS
  UPPER_ARMS
  LOWER_ARMS
  UPPER_LEGS
  LOWER_LEGS
  WAIST
  CARDIO
  NECK
}

model Exercise {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  instructions String[]
  bodyPart     BodyPart
  target       String
  equipment    String
  secondary    String[]
  gifUrl       String?
  archivedAt   DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([bodyPart])
  @@index([equipment])
}
```

- [ ] **Étape 5 : Écrire le client**

`packages/db/src/index.ts` — la mise en cache sur `globalThis` évite d'épuiser les connexions en développement. **Corollaire à ne pas oublier : changer de branche Neon impose de redémarrer le serveur de dev.**

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "./generated/client.js";
```

- [ ] **Étape 6 : Générer et migrer**

```bash
pnpm install
pnpm db:generate
pnpm --filter @better-lift/db exec prisma migrate dev --name init_catalogue_aplati
```

Attendu : migration créée et appliquée sur la branche **`dev`**. Relire le SQL généré avant de passer à la suite.

- [ ] **Étape 7 : Vérifier la connexion**

```bash
pnpm --filter @better-lift/db exec prisma db execute --stdin <<< "SELECT 1;"
```

Attendu : aucune erreur.

- [ ] **Étape 8 : Commit**

```bash
git add packages/db .gitignore
git commit -m "feat(db): prisma 7 sur neon, catalogue aplati sans table de traductions"
```

---

### Tâche 4 : `apps/api` — Hono et la route de santé

**Fichiers :**
- Créer : `apps/api/package.json`, `apps/api/tsconfig.json`
- Créer : `apps/api/src/index.ts`, `apps/api/src/routes/health.ts`
- Test : `apps/api/src/routes/health.test.ts`

**Interfaces :**
- Consomme : `@better-lift/db`
- Produit :
  - `app` — l'instance Hono, exportée par défaut
  - `export type AppType = typeof routes` — **c'est le type que le client RPC consomme** (D12)
  - `GET /health` → `{ status: "ok" | "degraded", version: string, db: boolean, uptimeSec: number }`

- [ ] **Étape 1 : Créer le paquet**

`apps/api/package.json` :

```json
{
  "name": "@better-lift/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist .turbo node_modules"
  },
  "dependencies": {
    "@better-lift/db": "workspace:*",
    "@better-lift/shared": "workspace:*",
    "@hono/node-server": "2.1.1",
    "hono": "4.13.8"
  },
  "devDependencies": {
    "@better-lift/config": "workspace:*",
    "tsx": "^4.20.0",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

- [ ] **Étape 2 : Écrire le test qui échoue**

`apps/api/src/routes/health.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { health } from "./health.js";

describe("GET /health", () => {
  it("rend un statut et une durée de fonctionnement", async () => {
    const res = await health.request("/");
    expect(res.status).toBe(200);

    const corps = await res.json();
    expect(corps).toMatchObject({
      status: expect.stringMatching(/^(ok|degraded)$/),
      version: expect.any(String),
      db: expect.any(Boolean),
      uptimeSec: expect.any(Number),
    });
  });
});
```

- [ ] **Étape 3 : Lancer le test pour vérifier qu'il échoue**

```bash
pnpm --filter @better-lift/api exec vitest run src/routes/health.test.ts
```

Attendu : ÉCHEC — module introuvable.

- [ ] **Étape 4 : Écrire la route**

`apps/api/src/routes/health.ts` :

```ts
import { Hono } from "hono";
import { prisma } from "@better-lift/db";

const demarrage = Date.now();

export const health = new Hono().get("/", async (c) => {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  return c.json({
    status: db ? ("ok" as const) : ("degraded" as const),
    version: process.env.npm_package_version ?? "0.0.0",
    db,
    uptimeSec: Math.floor((Date.now() - demarrage) / 1000),
  });
});
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il passe**

```bash
pnpm --filter @better-lift/api exec vitest run src/routes/health.test.ts
```

Attendu : vert. La base est joignable, donc `status` vaut `ok`.

- [ ] **Étape 6 : Écrire le point d'entrée**

`apps/api/src/index.ts` — le CORS n'est nécessaire qu'en développement, où Vite et l'API occupent deux ports ; en production, même origine (D18).

```ts
> **L'API doit charger le `.env` elle-même.** Node ne le fait pas, et Prisma 7 ne le fait plus non plus : sans cela, `DATABASE_URL` vaut `undefined` et l'adaptateur échoue au premier appel. Ajoute en toute première ligne de `src/index.ts`, avant les autres imports :
>
> ```ts
> import { existsSync } from "node:fs";
> const envPath = new URL("../../../.env", import.meta.url);
> if (existsSync(envPath)) process.loadEnvFile(envPath);
> ```
>
> `process.loadEnvFile` est natif à Node 24 — pas besoin de `dotenv`. **Le garde `existsSync` n'est pas facultatif** : en CI et sur Vercel les variables sont injectées dans l'environnement et aucun `.env` n'existe sur disque, où l'appel nu jetterait un `ENOENT`.

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { health } from "./routes/health.js";

const app = new Hono();

app.use(logger());
app.use(secureHeaders());
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    credentials: true,
  }),
);

const routes = app.route("/health", health);

export type AppType = typeof routes;
export default app;

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, () => {
  console.log(`API sur http://localhost:${port}`);
});
```

- [ ] **Étape 7 : Lancer et vérifier à la main**

```bash
pnpm --filter @better-lift/api dev
```

Dans un autre terminal :

```bash
curl -s http://localhost:3001/health
```

Attendu : `{"status":"ok","version":"0.0.0","db":true,"uptimeSec":…}`

- [ ] **Étape 8 : Commit**

```bash
git add apps/api
git commit -m "feat(api): socle hono avec la route de santé"
```

---

### Tâche 5 : `apps/web` — Vite, React et TanStack Router

**Fichiers :**
- Créer : `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/index.html`
- Créer : `apps/web/src/main.tsx`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/index.tsx`
- Créer : `apps/web/src/lib/api.ts`

**Interfaces :**
- Consomme : `AppType` de `@better-lift/api`
- Produit :
  - `api` — client Hono RPC typé, dans `src/lib/api.ts`
  - L'arbre de routes TanStack Router, généré dans `src/routeTree.gen.ts`

- [ ] **Étape 1 : Créer le paquet**

```json
{
  "name": "@better-lift/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .turbo node_modules"
  },
  "dependencies": {
    "@better-lift/shared": "workspace:*",
    "@tanstack/react-query": "5.103.2",
    "@tanstack/react-router": "1.170.38",
    "hono": "4.13.8",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@better-lift/api": "workspace:*",
    "@better-lift/config": "workspace:*",
    "@tanstack/router-plugin": "1.168.40",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "6.1.1",
    "typescript": "catalog:",
    "vite": "8.3.0"
  }
}
```

- [ ] **Étape 2 : Écrire `vite.config.ts`**

Le greffon du routeur doit venir **avant** celui de React.

```ts
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
```

- [ ] **Étape 3 : Écrire `index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>better-lift</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Étape 4 : Écrire le client RPC**

`apps/web/src/lib/api.ts` :

```ts
import { hc } from "hono/client";
import type { AppType } from "@better-lift/api";

/**
 * `credentials: "include"` est requis dès que le client et l'API sont sur
 * deux origines — c'est le cas en développement (3000 contre 3001).
 */
export const api = hc<AppType>(import.meta.env.VITE_API_URL ?? "http://localhost:3001", {
  init: { credentials: "include" },
});
```

- [ ] **Étape 5 : Écrire la route racine**

`apps/web/src/routes/__root.tsx` :

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
});
```

- [ ] **Étape 6 : Écrire la page d'accueil**

`apps/web/src/routes/index.tsx` — elle prouve la chaîne web → API.

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../lib/api";

export const Route = createFileRoute("/")({ component: Accueil });

function Accueil() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.health.$get();
      if (!res.ok) throw new Error("API injoignable");
      return res.json();
    },
  });

  if (isPending) return <p>Vérification de l'API…</p>;
  if (isError) return <p>API injoignable.</p>;

  return (
    <main>
      <h1>better-lift</h1>
      <p>
        API {data.status === "ok" ? "opérationnelle" : "dégradée"} — base{" "}
        {data.db ? "connectée" : "injoignable"}, en ligne depuis {data.uptimeSec} s.
      </p>
    </main>
  );
}
```

- [ ] **Étape 7 : Écrire le point de montage**

`apps/web/src/main.tsx` :

```tsx
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root introuvable");

createRoot(racine).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

- [ ] **Étape 8 : Lancer et vérifier dans le navigateur**

```bash
pnpm install
pnpm --filter @better-lift/web dev
```

Ouvrir `http://localhost:3000`. Attendu : « API opérationnelle — base connectée, en ligne depuis N s. »

Le fichier `src/routeTree.gen.ts` est écrit par le greffon au premier démarrage. L'ajouter à `.gitignore` :

```bash
echo "apps/web/src/routeTree.gen.ts" >> .gitignore
```

- [ ] **Étape 9 : Commit**

```bash
git add apps/web .gitignore
git commit -m "feat(web): socle vite, tanstack router et client rpc typé"
```

---

### Tâche 6 : `apps/mobile` — Expo minimal

**Fichiers :**
- Créer : `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`
- Créer : `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- Créer : `apps/mobile/.env`

**Interfaces :**
- Consomme : l'API par `EXPO_PUBLIC_API_URL`
- Produit : une application Expo Router qui affiche l'état de l'API

> L'objectif de cette tâche est de **prouver la chaîne mobile → API**, rien de plus. Aucun module natif n'est ajouté ici : MMKV viendra au lot 6, et chaque module natif impose un nouveau build EAS.

- [ ] **Étape 1 : Créer le paquet**

```json
{
  "name": "@better-lift/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .expo .turbo node_modules"
  },
  "dependencies": {
    "@better-lift/shared": "workspace:*",
    "@tanstack/react-query": "5.103.2",
    "expo": "57.0.24",
    "expo-router": "~7.0.0",
    "expo-status-bar": "~3.0.0",
    "react": "catalog:",
    "react-native": "0.87.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.20.0"
  },
  "devDependencies": {
    "@better-lift/config": "workspace:*",
    "@types/react": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Étape 2 : Écrire `app.json`**

Le schéma d'URL sert au lien profond de l'authentification, plus tard.

```json
{
  "expo": {
    "name": "better-lift",
    "slug": "better-lift",
    "scheme": "better-lift",
    "version": "0.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "plugins": ["expo-router"],
    "android": { "package": "com.algont.betterlift" },
    "ios": { "bundleIdentifier": "com.algont.betterlift" }
  }
}
```

- [ ] **Étape 3 : Écrire `.env`**

**Sur émulateur, `localhost` désigne l'émulateur lui-même, pas la machine hôte.**

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
# Sur téléphone physique, remplacer par l'IP de la machine sur le réseau local.
```

- [ ] **Étape 4 : Écrire la mise en page et l'écran**

`apps/mobile/app/_layout.tsx` :

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

`apps/mobile/app/index.tsx` :

```tsx
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001";

export default function Accueil() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch(`${API}/health`);
      if (!res.ok) throw new Error("API injoignable");
      return res.json() as Promise<{ status: string; db: boolean }>;
    },
  });

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>better-lift</Text>
      {isPending && <Text style={styles.texte}>Vérification de l'API…</Text>}
      {isError && <Text style={styles.texte}>API injoignable.</Text>}
      {data && (
        <Text style={styles.texte}>
          API {data.status === "ok" ? "opérationnelle" : "dégradée"} — base{" "}
          {data.db ? "connectée" : "injoignable"}.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#08090a" },
  titre: { color: "#f2f3f5", fontSize: 24, fontWeight: "600", marginBottom: 8 },
  texte: { color: "#b6bcc4", fontSize: 15 },
});
```

- [ ] **Étape 5 : Vérifier la version de TypeScript acceptée**

L'ancien projet était bloqué en TypeScript 6.0.3 **par Expo seul**. Expo 57 n'exprime plus de contrainte de pair sur TypeScript, donc il faut vérifier plutôt que supposer :

```bash
pnpm install
pnpm --filter @better-lift/mobile exec npx expo-doctor
```

Si `expo-doctor` signale une incompatibilité TypeScript, redescendre la valeur du catalog à celle qu'il réclame **et le noter dans `CLAUDE.md`** — c'est une contrainte qui se reperd sinon.

- [ ] **Étape 6 : Lancer sur l'émulateur**

L'émulateur `better-lift` (Pixel 8, x86_64) est déjà configuré sur la machine.

```bash
emulator -avd better-lift &
pnpm --filter @better-lift/mobile dev
```

Attendu : « API opérationnelle — base connectée. »

> **`expo run:android` ne marche pas sur cette machine** et ce n'est pas réparé : les chemins du magasin pnpm dépassent la limite de CMake. Pour cette tâche, Expo Go ou le dev client existant suffisent — aucun module natif n'est ajouté.
>
> **Piège d'exécution :** tuer le processus Metro fait tomber tout l'arbre `turbo` de `pnpm dev`, API comprise, en silence. Le symptôme trompeur est « API injoignable » côté application alors que le problème est côté hôte. Vérifier avec `Get-NetTCPConnection -LocalPort 3001` avant d'accuser le réseau de l'émulateur.

- [ ] **Étape 7 : Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): socle expo router affichant l'état de l'api"
```

---

### Tâche 7 : Intégration continue et protection de branche

**Fichiers :**
- Créer : `.github/workflows/ci.yml`

**Interfaces :**
- Consomme : les scripts racine de la tâche 1
- Produit : un job nommé **exactement** `Qualité · typecheck · test · build` — ce nom devient le check requis du ruleset.

> **Le nom du job et le `context` du ruleset doivent bouger ensemble.** Renommer l'un sans l'autre rend toute PR immergeable.

- [ ] **Étape 1 : Écrire le workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  qualite:
    name: Qualité · typecheck · test · build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint:ci

      - run: pnpm --filter @better-lift/db run generate

      - run: pnpm typecheck

      - run: pnpm test

      - run: pnpm build
        env:
          VITE_API_URL: http://localhost:3001

      - run: pnpm knip
```

> `pnpm/action-setup` lit le champ `packageManager` du `package.json` racine. C'est ce mécanisme qui, en août, a fait passer toutes les PR au rouge d'un coup quand la version pinnée s'est révélée cassée — sans rapport avec le code, et invisible en local.

- [ ] **Étape 2 : Pousser et ouvrir la PR**

```bash
git add .github
git commit -m "ci: qualité, typecheck, test, build et knip"
git push -u origin feat/lot-0-socle
gh pr create --fill --base main
```

- [ ] **Étape 3 : Vérifier que la CI passe**

```bash
gh pr checks --watch
```

Attendu : le job vert. En cas d'échec, corriger avant de continuer — ne pas fusionner une CI rouge.

- [ ] **Étape 4 : Fusionner**

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Étape 5 : Réactiver le ruleset avec le bon nom de check**

Le ruleset `20136735` est désactivé et ses trois checks requis désignent l'ancienne CI (D26). Le remettre en service avec le check qui existe désormais.

**`PATCH` rend 404 sur cet endpoint : la bonne méthode est `PUT`, avec un payload complet.** `jq` n'est pas installé sur cette machine — passer par PowerShell.

```powershell
$rs = gh api repos/Alexis-Gontier/better-lift/rulesets/20136735 | ConvertFrom-Json
$rs.enforcement = 'active'
foreach ($regle in $rs.rules) {
  if ($regle.type -eq 'required_status_checks') {
    $regle.parameters.required_status_checks = @(
      @{ context = 'Qualité · typecheck · test · build' }
    )
  }
}
$payload = @{
  name = $rs.name; target = $rs.target; enforcement = $rs.enforcement
  conditions = $rs.conditions; rules = $rs.rules; bypass_actors = $rs.bypass_actors
} | ConvertTo-Json -Depth 20 -Compress
$payload | Out-File "$env:TEMP\rs.json" -Encoding utf8 -NoNewline
gh api --method PUT repos/Alexis-Gontier/better-lift/rulesets/20136735 --input "$env:TEMP\rs.json"
```

- [ ] **Étape 6 : Mettre `CLAUDE.md` à jour**

Retirer la mention « Aucun code applicatif » et celle du ruleset désactivé, qui deviennent fausses. Committer sur une branche `chore/`.

---

# LOT 1 — Coquille web

**Critère de sortie :** la coquille tient debout, les trois panneaux se redimensionnent, et leurs tailles survivent au rechargement.

---

### Tâche 8 : Tokens des deux thèmes

**Fichiers :**
- Créer : `apps/web/src/styles/tokens.css`, `apps/web/src/styles/globals.css`
- Modifier : `apps/web/src/main.tsx` (importer `globals.css`)
- Créer : `apps/web/components.json`

**Interfaces :**
- Produit : les variables CSS de la spec § 3, disponibles partout. shadcn/ui lit `components.json`.

- [ ] **Étape 1 : Créer la branche et installer Tailwind 4**

```bash
git checkout main && git pull
git checkout -b feat/lot-1-coquille
pnpm --filter @better-lift/web add tailwindcss@4.3.3 @tailwindcss/vite@4.3.3
```

- [ ] **Étape 2 : Brancher Tailwind sur Vite**

Ajouter le greffon dans `apps/web/vite.config.ts`, **après** `tanstackRouter` et `react` :

```ts
import tailwindcss from "@tailwindcss/vite";
// …
plugins: [
  tanstackRouter({ target: "react", autoCodeSplitting: true }),
  react(),
  tailwindcss(),
],
```

- [ ] **Étape 3 : Écrire les tokens**

`apps/web/src/styles/tokens.css` — **un token par rôle, deux valeurs par token** (D29). Le sombre est la valeur par défaut ; le clair est une surcharge.

```css
:root {
  /* Surfaces — l'échelle porte la hiérarchie */
  --canvas: #08090a;
  --surface-1: #101214;
  --surface-2: #181b1e;
  --surface-3: #1e2226;

  /* Filets */
  --line: #24272b;
  --line-strong: #32363b;

  /* Encre — quatre niveaux */
  --ink: #f2f3f5;
  --ink-muted: #b6bcc4;
  --ink-subtle: #868d96;
  --ink-faint: #6a717a;

  /* Accent — aplat contre texte (D28, D29) */
  --accent: #a8cf45;
  --accent-on: #0b0f04;
  --accent-ink: #a8cf45;
  --accent-wash: rgb(168 207 69 / 0.14);
  --focus-ring: rgb(168 207 69 / 0.45);

  /* Élévation — réservée au passager (D27) */
  --float-bg: rgb(28 32 36 / 0.9);
  --float-line: #383d44;
  --float-shadow: 0 20px 50px rgb(0 0 0 / 0.72), 0 3px 10px rgb(0 0 0 / 0.5);
  --scrim: rgb(4 5 6 / 0.45);

  --radius: 0.5rem;
}

[data-theme="light"] {
  --canvas: #f4f4f6;
  --surface-1: #ffffff;
  --surface-2: #f7f7f9;
  --surface-3: #edeef2;

  --line: #e3e3e7;
  --line-strong: #d6d6dc;

  --ink: #18181b;
  --ink-muted: #3f3f46;
  --ink-subtle: #52525b;
  --ink-faint: #71717a;

  /* L'aplat garde la même teinte : le texte sombre dessus passe largement.
     Le lime employé COMME TEXTE, lui, tombe sous 2:1 sur blanc — il s'assombrit. */
  --accent: #a8cf45;
  --accent-on: #0b0f04;
  --accent-ink: #5c7a14;
  --accent-wash: rgb(92 122 20 / 0.12);
  --focus-ring: rgb(92 122 20 / 0.45);

  --float-bg: rgb(255 255 255 / 0.92);
  --float-line: #d6d6dc;
  --float-shadow: 0 18px 44px rgb(20 20 25 / 0.18), 0 3px 10px rgb(20 20 25 / 0.1);
  --scrim: rgb(20 20 25 / 0.28);
}
```

- [ ] **Étape 4 : Écrire la feuille globale**

`apps/web/src/styles/globals.css` :

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle);
  --color-ink-faint: var(--ink-faint);
  --color-accent: var(--accent);
  --color-accent-on: var(--accent-on);
  --color-accent-ink: var(--accent-ink);
}

body {
  margin: 0;
  background: var(--canvas);
  color: var(--ink);
  font-family: "Instrument Sans", system-ui, sans-serif;
}

/* Les animations pilotées en JavaScript échappent à cette règle : toute
   bibliothèque de graphiques devra désactiver les siennes explicitement. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Étape 5 : Importer dans `main.tsx`**

Ajouter en première ligne de `apps/web/src/main.tsx` :

```tsx
import "./styles/globals.css";
```

- [ ] **Étape 6 : Vérifier le contraste**

Contrôler les six paires sur un vérificateur de contraste. Seuils : **4,5:1** sur le texte courant, **3:1** dès 24 px.

| Paire | Thème | Attendu |
|---|---|---|
| `--ink` sur `--canvas` | sombre | ≥ 15:1 |
| `--ink-subtle` sur `--surface-1` | sombre | ≥ 4,5:1 |
| `--accent-ink` sur `--surface-1` | sombre | ≥ 4,5:1 |
| `--ink` sur `--canvas` | clair | ≥ 15:1 |
| `--ink-subtle` sur `--surface-1` | clair | ≥ 4,5:1 |
| `--accent-ink` sur `--surface-1` | clair | ≥ 4,5:1 |

Toute paire en dessous du seuil se corrige **maintenant**, pas au moment où un écran l'utilise.

- [ ] **Étape 7 : Commit**

```bash
git add apps/web/src/styles apps/web/vite.config.ts apps/web/src/main.tsx
git commit -m "feat(web): tokens des deux thèmes, un token par rôle"
```

---

### Tâche 9 : shadcn/ui, Resizable et Command

**Fichiers :**
- Créer : `apps/web/components.json`
- Créer : `apps/web/src/components/ui/*` (écrits par le CLI)
- Créer : `apps/web/src/lib/utils.ts`

**Interfaces :**
- Produit : `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`, `Command` et ses parties, `Dialog`, `Button`, `Input`, `cn()`

- [ ] **Étape 1 : Initialiser shadcn**

```bash
cd apps/web
pnpm dlx shadcn@latest init
```

Répondre : style **New York**, couleur de base **Neutral**, variables CSS **oui**.

- [ ] **Étape 2 : Ajouter les primitives nécessaires**

```bash
pnpm dlx shadcn@latest add resizable command dialog button input separator tooltip
```

> **Le CLI shadcn écrit ses dépendances dans le `package.json` de l'application.** Vérifier ce qu'il a ajouté (`react-resizable-panels`, `cmdk`) et remonter les versions au catalog si elles doivent être partagées.

- [ ] **Étape 3 : Vérifier que rien n'a écrasé les tokens**

```bash
git diff apps/web/src/styles/globals.css
```

Si le CLI a réécrit la feuille globale, **restaurer les tokens de la tâche 8** et ne garder de son apport que ce qui manque.

- [ ] **Étape 4 : Vérifier que ça compile**

```bash
pnpm --filter @better-lift/web typecheck
```

- [ ] **Étape 5 : Commit**

```bash
git add apps/web
git commit -m "feat(web): primitives shadcn — panneaux redimensionnables et palette"
```

---

### Tâche 10 : La coquille à trois panneaux

**Fichiers :**
- Créer : `apps/web/src/components/shell/app-shell.tsx`
- Créer : `apps/web/src/components/shell/nav-lateral.tsx`
- Modifier : `apps/web/src/routes/__root.tsx`

**Interfaces :**
- Consomme : `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- Produit :
  - `<AppShell liste={…} detail={…} />` — `detail` vaut `null` quand rien n'est sélectionné, auquel cas le troisième panneau ne s'affiche pas
  - `<NavLaterale />`

- [ ] **Étape 1 : Écrire la navigation**

`apps/web/src/components/shell/nav-lateral.tsx` :

```tsx
import { Link } from "@tanstack/react-router";

const ENTREES = [
  { to: "/seances", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercices", label: "Exercices" },
] as const;

export function NavLaterale() {
  return (
    <nav aria-label="Navigation principale" className="flex h-full flex-col gap-0.5 p-2.5">
      <div className="flex items-center gap-2 px-2 pb-4 pt-1.5">
        <span
          aria-hidden="true"
          className="size-5.5 rounded-md"
          style={{ background: "var(--accent)" }}
        />
        <span className="text-sm font-semibold tracking-tight">better-lift</span>
      </div>

      {ENTREES.map((entree) => (
        <Link
          key={entree.to}
          to={entree.to}
          className="rounded-md px-2.5 py-2 text-sm text-(--ink-muted) hover:bg-(--surface-3)"
          activeProps={{
            className:
              "rounded-md px-2.5 py-2 text-sm font-medium text-(--ink) bg-(--surface-3) shadow-[inset_2px_0_0_var(--accent)]",
          }}
        >
          {entree.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Étape 2 : Écrire la coquille**

`apps/web/src/components/shell/app-shell.tsx` — `autoSaveId` persiste les tailles en `localStorage`, **ce qui est lu avant le premier rendu** : c'est précisément ce que Next.js ne permettait pas sans rendre toutes les routes dynamiques.

```tsx
import type { ReactNode } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NavLaterale } from "./nav-lateral";

type Props = {
  liste: ReactNode;
  detail?: ReactNode;
};

export function AppShell({ liste, detail }: Props) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="better-lift-shell"
      className="h-screen w-screen"
    >
      <ResizablePanel defaultSize={16} minSize={12} maxSize={26}>
        <NavLaterale />
      </ResizablePanel>

      <ResizableHandle className="bg-(--line)" />

      <ResizablePanel defaultSize={detail ? 56 : 84} minSize={30}>
        {liste}
      </ResizablePanel>

      {detail ? (
        <>
          <ResizableHandle className="bg-(--line)" />
          <ResizablePanel defaultSize={28} minSize={20} maxSize={44}>
            <aside aria-label="Détail" className="h-full bg-(--surface-1)">
              {detail}
            </aside>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  );
}
```

- [ ] **Étape 3 : Vérifier à la main**

```bash
pnpm --filter @better-lift/web dev
```

Trois contrôles, dans cet ordre :

1. Tirer la poignée entre la navigation et la liste — elle se déplace.
2. **Recharger la page** — la largeur est conservée.
3. Naviguer au clavier : `Tab` atteint la poignée, les flèches la déplacent.

Le troisième contrôle est le plus important : une poignée qui ne répond qu'à la souris est un défaut d'accessibilité que la lecture du code ne révèle pas.

- [ ] **Étape 4 : Commit**

```bash
git add apps/web/src/components/shell
git commit -m "feat(web): coquille à trois panneaux, tailles persistées"
```

---

### Tâche 11 : La palette de commandes

**Fichiers :**
- Créer : `apps/web/src/components/shell/palette.tsx`
- Modifier : `apps/web/src/routes/__root.tsx`

**Interfaces :**
- Produit : `<Palette />` — s'ouvre sur `Cmd+K` ou `Ctrl+K`

> **C'est ici que le registre hybride se voit** (D27) : la palette est la seule chose qui s'élève. Flou, ombre portée et voile.

- [ ] **Étape 1 : Écrire le composant**

```tsx
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function Palette() {
  const [ouverte, setOuverte] = useState(false);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOuverte((o) => !o);
      }
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, []);

  return (
    <CommandDialog
      open={ouverte}
      onOpenChange={setOuverte}
      title="Palette de commandes"
      description="Rechercher un exercice ou lancer une action"
    >
      <CommandInput placeholder="Rechercher un exercice, une routine, une action…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>Démarrer une séance libre</CommandItem>
          <CommandItem>Créer une routine</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

- [ ] **Étape 2 : Habiller la palette au registre flottant**

Ajouter dans `apps/web/src/styles/globals.css` :

```css
[data-slot="command-dialog-content"] {
  background: var(--float-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--float-line);
  box-shadow: var(--float-shadow);
}

[data-slot="dialog-overlay"] {
  background: var(--scrim);
}
```

> Si les sélecteurs ne mordent pas, inspecter le composant généré : le CLI shadcn peut nommer ses parties autrement selon la version. Corriger le sélecteur plutôt que de dupliquer les valeurs.

- [ ] **Étape 3 : Monter la palette**

Dans `apps/web/src/routes/__root.tsx`, placer `<Palette />` à côté de `<Outlet />`, à l'intérieur du `QueryClientProvider`.

- [ ] **Étape 4 : Vérifier à la main**

`Cmd+K` ouvre, `Échap` ferme, la palette flotte au-dessus d'un fond assombri, et la saisie filtre.

- [ ] **Étape 5 : Commit**

```bash
git add apps/web
git commit -m "feat(web): palette de commandes, seul élément élevé de l'interface"
```

---

### Tâche 12 : Bascule de thème

**Fichiers :**
- Créer : `apps/web/src/lib/theme.ts`
- Modifier : `apps/web/src/components/shell/nav-lateral.tsx`, `apps/web/index.html`

**Interfaces :**
- Produit : `appliquerTheme(t: Theme)`, `themeInitial(): Theme`, `type Theme = "dark" | "light"`

- [ ] **Étape 1 : Écrire le module**

```ts
export type Theme = "dark" | "light";

const CLE = "better-lift-theme";

export function themeInitial(): Theme {
  try {
    const stocke = localStorage.getItem(CLE);
    if (stocke === "dark" || stocke === "light") return stocke;
  } catch {
    // Navigation privée, stockage bloqué : on retombe sur la préférence système.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function appliquerTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(CLE, t);
  } catch {
    // Sans persistance, le thème reste valable pour la session.
  }
}
```

- [ ] **Étape 2 : Éviter le clignotement au chargement**

Ajouter dans `<head>` de `apps/web/index.html`, **avant** le script du module :

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("better-lift-theme");
      if (t !== "dark" && t !== "light") {
        t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }
      document.documentElement.dataset.theme = t;
    } catch (e) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
</script>
```

Sans ce script synchrone, la page s'affiche une fraction de seconde dans le mauvais thème.

- [ ] **Étape 3 : Ajouter le bouton dans la navigation**

Un vrai `<button>` avec `aria-label`, placé en bas de `NavLaterale`.

- [ ] **Étape 4 : Vérifier à la main**

Basculer, **recharger** : le thème tient. Vérifier que les deux thèmes restent lisibles, notamment le lime en texte, qui doit visiblement s'assombrir en clair.

- [ ] **Étape 5 : Ouvrir la PR du lot 1**

```bash
git add apps/web
git commit -m "feat(web): bascule de thème sans clignotement au chargement"
git push -u origin feat/lot-1-coquille
gh pr create --fill --base main
gh pr checks --watch
```

---

# LOT 2 — Écrans web dessinés

**Critère de sortie :** les trois écrans sont validés visuellement, **avec leurs quatre états**, avant toute API.

> **L'angle mort de cette méthode, énoncé dans la spec § 11 :** dessiner sur données factices fait manquer ce que seules les vraies données révèlent. C'est pourquoi chaque écran porte ses **quatre états dès le dessin** — vide, chargement, erreur, nominal — et des libellés délibérément longs dans les données factices.

---

### Tâche 13 : Données factices et états partagés

**Fichiers :**
- Créer : `apps/web/src/mocks/exercices.ts`, `apps/web/src/mocks/routines.ts`, `apps/web/src/mocks/seances.ts`
- Créer : `apps/web/src/components/etats/etat-vide.tsx`, `etat-chargement.tsx`, `etat-erreur.tsx`
- Test : `apps/web/src/mocks/exercices.test.ts`

**Interfaces :**
- Produit :
  - `EXERCICES: ExerciceFactice[]` avec `{ id, nom, groupe, equipement, record?: { kg: number; reps: number } }`
  - `<EtatVide titre message action? />`, `<EtatChargement lignes? />`, `<EtatErreur message onReessayer />`

- [ ] **Étape 1 : Écrire le test qui échoue**

Ce test garde l'angle mort décrit plus haut : il **impose** des cas pénibles dans les données factices.

```ts
import { describe, expect, it } from "vitest";
import { EXERCICES } from "./exercices.js";

describe("données factices du catalogue", () => {
  it("fournit de quoi remplir une liste", () => {
    expect(EXERCICES.length).toBeGreaterThanOrEqual(20);
  });

  it("contient au moins un nom très long, pour éprouver la troncature", () => {
    expect(EXERCICES.some((e) => e.nom.length > 45)).toBe(true);
  });

  it("contient des exercices sans record, pour éprouver l'absence", () => {
    expect(EXERCICES.some((e) => e.record === undefined)).toBe(true);
  });
});
```

- [ ] **Étape 2 : Vérifier l'échec**

```bash
pnpm --filter @better-lift/web exec vitest run src/mocks/exercices.test.ts
```

- [ ] **Étape 3 : Écrire les données factices**

`apps/web/src/mocks/exercices.ts` — noms en **français d'usage** (D21) : les anglicismes réellement employés en salle sont conservés.

```ts
export type ExerciceFactice = {
  id: string;
  nom: string;
  groupe: string;
  equipement: string;
  record?: { kg: number; reps: number };
};

export const EXERCICES: ExerciceFactice[] = [
  { id: "1", nom: "Développé couché barre", groupe: "Pectoraux", equipement: "Barre", record: { kg: 85, reps: 5 } },
  { id: "2", nom: "Développé couché haltères", groupe: "Pectoraux", equipement: "Haltères", record: { kg: 32, reps: 8 } },
  { id: "3", nom: "Développé incliné barre", groupe: "Pectoraux", equipement: "Barre" },
  { id: "4", nom: "Développé incliné haltères", groupe: "Pectoraux", equipement: "Haltères" },
  { id: "5", nom: "Développé décliné à la machine convergente", groupe: "Pectoraux", equipement: "Machine" },
  { id: "6", nom: "Écarté couché aux haltères sur banc incliné à 30 degrés", groupe: "Pectoraux", equipement: "Haltères" },
  { id: "7", nom: "Squat barre", groupe: "Quadriceps", equipement: "Barre", record: { kg: 120, reps: 5 } },
  { id: "8", nom: "Squat avant", groupe: "Quadriceps", equipement: "Barre" },
  { id: "9", nom: "Presse à cuisses", groupe: "Quadriceps", equipement: "Machine", record: { kg: 200, reps: 10 } },
  { id: "10", nom: "Leg extension à la machine", groupe: "Quadriceps", equipement: "Machine" },
  { id: "11", nom: "Soulevé de terre barre", groupe: "Dos", equipement: "Barre", record: { kg: 140, reps: 3 } },
  { id: "12", nom: "Soulevé de terre roumain", groupe: "Ischios", equipement: "Barre" },
  { id: "13", nom: "Rowing barre", groupe: "Dos", equipement: "Barre", record: { kg: 80, reps: 8 } },
  { id: "14", nom: "Rowing haltère à un bras", groupe: "Dos", equipement: "Haltères" },
  { id: "15", nom: "Traction pronation", groupe: "Dos", equipement: "Poids du corps", record: { kg: 10, reps: 6 } },
  { id: "16", nom: "Traction assistée", groupe: "Dos", equipement: "Machine" },
  { id: "17", nom: "Curl barre", groupe: "Biceps", equipement: "Barre", record: { kg: 45, reps: 8 } },
  { id: "18", nom: "Curl incliné haltères", groupe: "Biceps", equipement: "Haltères" },
  { id: "19", nom: "Pushdown triceps à la poulie", groupe: "Triceps", equipement: "Poulie", record: { kg: 40, reps: 12 } },
  { id: "20", nom: "Dips lestés", groupe: "Triceps", equipement: "Poids du corps" },
  { id: "21", nom: "Élévations latérales haltères", groupe: "Épaules", equipement: "Haltères" },
  { id: "22", nom: "Développé militaire barre", groupe: "Épaules", equipement: "Barre", record: { kg: 55, reps: 6 } },
];
```

- [ ] **Étape 4 : Vérifier que les tests passent**

```bash
pnpm --filter @better-lift/web exec vitest run src/mocks/exercices.test.ts
```

Attendu : 3 tests verts.

- [ ] **Étape 5 : Écrire les trois composants d'état**

`etat-vide.tsx` :

```tsx
import type { ReactNode } from "react";

export function EtatVide({
  titre,
  message,
  action,
}: {
  titre: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-base font-medium text-(--ink)">{titre}</p>
      <p className="max-w-sm text-sm text-(--ink-subtle)">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
```

`etat-chargement.tsx` — des squelettes de largeur **fixe**, jamais tirée au hasard : une largeur aléatoire rend le composant inutilisable dès qu'un rendu serveur entre en jeu, et rend les captures instables.

```tsx
const LARGEURS = ["72%", "58%", "81%", "64%", "76%", "52%", "69%", "60%"];

export function EtatChargement({ lignes = 8 }: { lignes?: number }) {
  return (
    <div className="flex flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="flex h-[54px] items-center gap-3 border-b border-(--line) px-5">
          <div className="size-8.5 shrink-0 rounded-md bg-(--surface-2)" />
          <div className="h-3.5 rounded bg-(--surface-2)" style={{ width: LARGEURS[i % LARGEURS.length] }} />
        </div>
      ))}
    </div>
  );
}
```

`etat-erreur.tsx` :

```tsx
export function EtatErreur({
  message,
  onReessayer,
}: {
  message: string;
  onReessayer: () => void;
}) {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="text-base font-medium text-(--ink)">Quelque chose n'a pas fonctionné</p>
      <p className="max-w-sm text-sm text-(--ink-subtle)">{message}</p>
      <button
        type="button"
        onClick={onReessayer}
        className="rounded-md px-4 py-2 text-sm font-semibold"
        style={{ background: "var(--accent)", color: "var(--accent-on)" }}
      >
        Réessayer
      </button>
    </div>
  );
}
```

- [ ] **Étape 6 : Commit**

```bash
git add apps/web/src/mocks apps/web/src/components/etats
git commit -m "feat(web): données factices et les trois états partagés"
```

---

### Tâche 14 : L'écran catalogue

**Fichiers :**
- Créer : `apps/web/src/routes/exercices.tsx`
- Créer : `apps/web/src/features/exercices/liste-exercices.tsx`, `detail-exercice.tsx`, `badge-record.tsx`

**Interfaces :**
- Consomme : `AppShell`, `EXERCICES`, les trois composants d'état
- Produit : `<BadgeRecord kg reps />` — **le contour** du couple aplat/contour (D28), réutilisé partout où un record s'affiche

- [ ] **Étape 0 : Installer Zod**

C'est ici que Zod entre dans le projet, et nulle part avant : `validateSearch` est son premier usage réel. Le déclarer plus tôt ferait échouer `knip` en CI dès la tâche 7, pour une dépendance que personne n'importe.

```bash
pnpm --filter @better-lift/web add zod@4.6.5
```

- [ ] **Étape 1 : Écrire le badge de record**

C'est l'invariant de la spec § 3 : l'action est un aplat, le record un **contour avec flèche montante**. Une seule implémentation, réutilisée partout.

```tsx
export function BadgeRecord({ kg, reps }: { kg: number; reps: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11.5px]"
      style={{ color: "var(--accent-ink)", background: "var(--accent-wash)" }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {kg} kg × {reps}
    </span>
  );
}
```

- [ ] **Étape 2 : Écrire la route avec ses filtres dans l'URL**

Le détail ouvert et la recherche vivent dans l'URL, validés par schéma — c'est la raison d'être de TanStack Router ici (D19).

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/shell/app-shell";
import { DetailExercice } from "@/features/exercices/detail-exercice";
import { ListeExercices } from "@/features/exercices/liste-exercices";
import { EXERCICES } from "@/mocks/exercices";

const recherche = z.object({
  q: z.string().optional(),
  groupe: z.string().optional(),
  id: z.string().optional(),
});

export const Route = createFileRoute("/exercices")({
  validateSearch: recherche,
  component: PageExercices,
});

function PageExercices() {
  const { q, groupe, id } = Route.useSearch();
  const navigate = Route.useNavigate();

  const visibles = EXERCICES.filter((e) => {
    const parNom = q ? e.nom.toLowerCase().includes(q.toLowerCase()) : true;
    const parGroupe = groupe ? e.groupe === groupe : true;
    return parNom && parGroupe;
  });

  const selectionne = id ? EXERCICES.find((e) => e.id === id) : undefined;

  return (
    <AppShell
      liste={
        <ListeExercices
          exercices={visibles}
          q={q ?? ""}
          idSelectionne={id}
          onRecherche={(valeur) =>
            navigate({ search: (s) => ({ ...s, q: valeur || undefined }) })
          }
          onSelection={(exId) => navigate({ search: (s) => ({ ...s, id: exId }) })}
        />
      }
      detail={
        selectionne ? (
          <DetailExercice
            exercice={selectionne}
            onFermer={() => navigate({ search: (s) => ({ ...s, id: undefined }) })}
          />
        ) : undefined
      }
    />
  );
}
```

- [ ] **Étape 3 : Écrire la liste**

Elle doit gérer le cas vide — c'est le plus facile à oublier, et le premier que l'utilisateur rencontrera en tapant n'importe quoi dans la recherche.

```tsx
import type { ExerciceFactice } from "@/mocks/exercices";
import { EtatVide } from "@/components/etats/etat-vide";
import { BadgeRecord } from "./badge-record";

type Props = {
  exercices: ExerciceFactice[];
  q: string;
  idSelectionne?: string;
  onRecherche: (v: string) => void;
  onSelection: (id: string) => void;
};

export function ListeExercices({ exercices, q, idSelectionne, onRecherche, onSelection }: Props) {
  return (
    <section className="flex h-full flex-col">
      <header className="border-b border-(--line) px-5 pb-3 pt-4">
        <div className="mb-3.5 flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight">Exercices</h1>
          <span className="font-mono text-xs text-(--ink-subtle)">{exercices.length}</span>
        </div>
        <label htmlFor="recherche-exercice" className="sr-only">
          Rechercher un exercice
        </label>
        <input
          id="recherche-exercice"
          type="search"
          value={q}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher un exercice…"
          className="w-full rounded-md border border-(--line) bg-(--surface-1) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        />
      </header>

      {exercices.length === 0 ? (
        <EtatVide
          titre="Aucun exercice trouvé"
          message={`Rien ne correspond à « ${q} ». Essaie un autre terme, ou retire les filtres.`}
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {exercices.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onSelection(ex.id)}
                aria-current={ex.id === idSelectionne ? "true" : undefined}
                className={`flex h-[54px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                  ex.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-(--ink)">{ex.nom}</span>
                  <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                    {ex.groupe} · {ex.equipement}
                  </span>
                </span>
                {ex.record ? <BadgeRecord kg={ex.record.kg} reps={ex.record.reps} /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Étape 4 : Écrire le détail**

Il porte le **bouton d'action en aplat**, face au badge en contour — les deux visibles simultanément, ce qui est exactement le cas à éprouver.

```tsx
import type { ExerciceFactice } from "@/mocks/exercices";
import { BadgeRecord } from "./badge-record";

export function DetailExercice({
  exercice,
  onFermer,
}: {
  exercice: ExerciceFactice;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{exercice.nom}</h2>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {exercice.groupe} · {exercice.equipement}
          </p>
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le panneau de détail"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-(--line) text-(--ink-subtle)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <button
          type="button"
          className="w-full rounded-md px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-on)" }}
        >
          Démarrer la séance
        </button>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Record</p>
          {exercice.record ? (
            <BadgeRecord kg={exercice.record.kg} reps={exercice.record.reps} />
          ) : (
            <p className="text-sm text-(--ink-faint)">
              Aucun record pour l'instant — il apparaîtra après ta première séance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Étape 5 : Éprouver les quatre états**

Les quatre, à la main, dans cet ordre :

1. **Nominal** — ouvrir `/exercices`, cliquer une ligne, le détail s'ouvre.
2. **Vide** — taper `zzzz` dans la recherche.
3. **Chargement** — rendre temporairement `<EtatChargement />` à la place de la liste, vérifier, remettre.
4. **Erreur** — idem avec `<EtatErreur />`.

Puis trois contrôles qui ne se voient qu'en exécutant :

- **Recharger avec un détail ouvert** : l'URL porte `?id=…&q=…`, et la page retombe au même endroit.
- **Le nom long** (`Écarté couché aux haltères sur banc incliné à 30 degrés`) est tronqué proprement, sans pousser le badge hors de la ligne.
- **Le bouton d'action et un badge de record sont visibles en même temps** : l'aplat et le contour doivent rester distinguables au premier coup d'œil. Si ce n'est pas le cas, c'est la règle D28 qui est mal appliquée — le corriger ici, avant que l'écran ne serve de modèle aux suivants.

- [ ] **Étape 6 : Commit**

```bash
git add apps/web/src/routes/exercices.tsx apps/web/src/features/exercices
git commit -m "feat(web): écran catalogue, filtres dans l'url et quatre états"
```

---

### Tâche 15 : L'écran routines

**Fichiers :**
- Créer : `apps/web/src/routes/routines.tsx`
- Créer : `apps/web/src/features/routines/liste-routines.tsx`, `detail-routine.tsx`

**Interfaces :**
- Consomme : `AppShell`, `EtatVide`, `BadgeRecord`
- Produit : rien que les suivants consomment

- [ ] **Étape 1 : Écrire les données factices**

`apps/web/src/mocks/routines.ts` :

```ts
export type RoutineFactice = {
  id: string;
  nom: string;
  exercices: { nom: string; series: number; repsCible: string }[];
};

export const ROUTINES: RoutineFactice[] = [
  {
    id: "r1",
    nom: "Push — pectoraux, épaules, triceps",
    exercices: [
      { nom: "Développé couché barre", series: 4, repsCible: "6–8" },
      { nom: "Développé incliné haltères", series: 3, repsCible: "8–10" },
      { nom: "Élévations latérales haltères", series: 3, repsCible: "12–15" },
      { nom: "Pushdown triceps à la poulie", series: 3, repsCible: "10–12" },
    ],
  },
  {
    id: "r2",
    nom: "Pull",
    exercices: [
      { nom: "Soulevé de terre barre", series: 3, repsCible: "3–5" },
      { nom: "Traction pronation", series: 4, repsCible: "6–8" },
      { nom: "Rowing haltère à un bras", series: 3, repsCible: "8–10" },
      { nom: "Curl barre", series: 3, repsCible: "8–12" },
    ],
  },
  {
    id: "r3",
    nom: "Legs",
    exercices: [
      { nom: "Squat barre", series: 4, repsCible: "5–8" },
      { nom: "Soulevé de terre roumain", series: 3, repsCible: "8–10" },
      { nom: "Presse à cuisses", series: 3, repsCible: "10–12" },
    ],
  },
];
```

- [ ] **Étape 2 : Écrire la route**

`apps/web/src/routes/routines.tsx` :

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/shell/app-shell";
import { EtatVide } from "@/components/etats/etat-vide";
import { DetailRoutine } from "@/features/routines/detail-routine";
import { ListeRoutines } from "@/features/routines/liste-routines";
import { ROUTINES } from "@/mocks/routines";

const recherche = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/routines")({
  validateSearch: recherche,
  component: PageRoutines,
});

function PageRoutines() {
  const { id } = Route.useSearch();
  const navigate = Route.useNavigate();

  const selectionnee = id ? ROUTINES.find((r) => r.id === id) : undefined;

  return (
    <AppShell
      liste={
        <ListeRoutines
          routines={ROUTINES}
          idSelectionne={id}
          onSelection={(rId) => navigate({ search: () => ({ id: rId }) })}
        />
      }
      detail={
        selectionnee ? (
          <DetailRoutine
            routine={selectionnee}
            onFermer={() => navigate({ search: () => ({}) })}
          />
        ) : undefined
      }
    />
  );
}
```

`apps/web/src/features/routines/liste-routines.tsx` :

```tsx
import type { RoutineFactice } from "@/mocks/routines";
import { EtatVide } from "@/components/etats/etat-vide";

type Props = {
  routines: RoutineFactice[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
};

export function ListeRoutines({ routines, idSelectionne, onSelection }: Props) {
  return (
    <section className="flex h-full flex-col">
      <header className="flex items-baseline gap-2.5 border-b border-(--line) px-5 pb-3.5 pt-4">
        <h1 className="text-lg font-semibold tracking-tight">Routines</h1>
        <span className="font-mono text-xs text-(--ink-subtle)">{routines.length}</span>
      </header>

      {routines.length === 0 ? (
        <EtatVide
          titre="Aucune routine"
          message="Une routine est un modèle de séance : une liste d'exercices avec leurs séries cibles. Crées-en une pour préparer tes prochains entraînements."
          action={
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-on)" }}
            >
              Créer une routine
            </button>
          }
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {routines.map((r) => {
            const totalSeries = r.exercices.reduce((n, e) => n + e.series, 0);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelection(r.id)}
                  aria-current={r.id === idSelectionne ? "true" : undefined}
                  className={`flex h-[62px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                    r.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-(--ink)">{r.nom}</span>
                    <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                      {r.exercices.length} exercices · {totalSeries} séries
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

`apps/web/src/features/routines/detail-routine.tsx` :

```tsx
import type { RoutineFactice } from "@/mocks/routines";

export function DetailRoutine({
  routine,
  onFermer,
}: {
  routine: RoutineFactice;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight">{routine.nom}</h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le panneau de détail"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-(--line) text-(--ink-subtle)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <button
          type="button"
          className="w-full rounded-md px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-on)" }}
        >
          Démarrer cette routine
        </button>

        <ul className="flex flex-col">
          {routine.exercices.map((ex) => (
            <li
              key={ex.nom}
              className="flex items-center gap-3 border-b border-(--line) py-2.5 last:border-0"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-(--ink)">{ex.nom}</span>
              <span className="shrink-0 font-mono text-xs text-(--ink-subtle)">
                {ex.series} × {ex.repsCible}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Étape 3 : Traiter le cas vide**

Un compte neuf n'a aucune routine. Ce n'est pas un cas exotique, c'est **le premier écran que tu verras** :

```tsx
<EtatVide
  titre="Aucune routine"
  message="Une routine est un modèle de séance : une liste d'exercices avec leurs séries cibles. Crées-en une pour préparer tes prochains entraînements."
  action={
    <button
      type="button"
      className="rounded-md px-4 py-2 text-sm font-semibold"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      Créer une routine
    </button>
  }
/>
```

- [ ] **Étape 4 : Éprouver les quatre états, puis commit**

```bash
git add apps/web/src/routes/routines.tsx apps/web/src/features/routines apps/web/src/mocks/routines.ts
git commit -m "feat(web): écran routines avec son état de premier lancement"
```

---

### Tâche 16 : L'écran historique et la clôture du lot

**Fichiers :**
- Créer : `apps/web/src/routes/seances.tsx`
- Créer : `apps/web/src/features/seances/liste-seances.tsx`, `detail-seance.tsx`
- Créer : `apps/web/src/mocks/seances.ts`
- Test : `apps/web/src/features/seances/format-date.test.ts`
- Créer : `packages/shared/src/calendar.ts`, `packages/shared/src/calendar.test.ts`

**Interfaces :**
- Produit : `formatJour(iso: string, fuseau: string): string` dans `@better-lift/shared`

> **Le piège le plus coûteux du projet est ici.** Le découpage temporel se fait dans le fuseau du profil, jamais en UTC : une séance du samedi 21 h à Paris est déjà dimanche en UTC en été. L'arithmétique civile vit dans `shared`, dont `Intl` est la seule dépendance tolérée.

- [ ] **Étape 1 : Écrire le test qui échoue**

`packages/shared/src/calendar.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { formatJour, memeJour } from "./calendar.js";

describe("arithmétique civile", () => {
  it("rend le jour du fuseau demandé, pas celui d'UTC", () => {
    // 21 h à Paris le samedi 20 septembre 2026 = 19 h UTC le même jour.
    // Mais 23 h à Paris = 21 h UTC — et à 01 h Paris, UTC est encore la veille.
    const samediSoir = "2026-09-20T23:30:00+02:00";
    expect(formatJour(samediSoir, "Europe/Paris")).toBe("20 septembre 2026");
  });

  it("ne fait pas basculer une séance de fin de soirée au lendemain", () => {
    const a = "2026-09-20T23:30:00+02:00";
    const b = "2026-09-20T18:00:00+02:00";
    expect(memeJour(a, b, "Europe/Paris")).toBe(true);
  });

  it("distingue bien deux jours civils consécutifs", () => {
    const samedi = "2026-09-20T23:30:00+02:00";
    const dimanche = "2026-09-21T00:30:00+02:00";
    expect(memeJour(samedi, dimanche, "Europe/Paris")).toBe(false);
  });
});
```

- [ ] **Étape 2 : Vérifier l'échec**

```bash
pnpm --filter @better-lift/shared exec vitest run src/calendar.test.ts
```

- [ ] **Étape 3 : Implémenter**

`packages/shared/src/calendar.ts` :

```ts
/**
 * Arithmétique civile : tout découpage temporel se fait dans le fuseau du
 * profil, jamais en UTC. `Intl` est la seule dépendance tolérée ici.
 */

export function formatJour(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: fuseau,
  }).format(new Date(iso));
}

/** La clé de jour civil : "2026-09-20" dans le fuseau donné. */
export function cleJour(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: fuseau,
  }).format(new Date(iso));
}

export function memeJour(a: string, b: string, fuseau: string): boolean {
  return cleJour(a, fuseau) === cleJour(b, fuseau);
}
```

- [ ] **Étape 4 : Vérifier que les tests passent et exporter**

```bash
pnpm --filter @better-lift/shared exec vitest run src/calendar.test.ts
```

Ajouter dans `packages/shared/src/index.ts` :

```ts
export { cleJour, formatJour, memeJour } from "./calendar.js";
```

- [ ] **Étape 5 : Écrire les données factices des séances**

`apps/web/src/mocks/seances.ts` — inclure **au moins une séance en soirée**, pour que le piège du fuseau soit visible à l'écran :

```ts
export type SeanceFactice = {
  id: string;
  titre: string;
  debutIso: string;
  dureeMin: number;
  volumeKg: number;
  exercices: { nom: string; series: { kg: number; reps: number; record?: boolean }[] }[];
};

export const SEANCES: SeanceFactice[] = [
  {
    id: "s1",
    titre: "Push",
    debutIso: "2026-09-20T23:30:00+02:00",
    dureeMin: 62,
    volumeKg: 7420,
    exercices: [
      {
        nom: "Développé couché barre",
        series: [
          { kg: 80, reps: 8 },
          { kg: 85, reps: 5, record: true },
          { kg: 80, reps: 6 },
        ],
      },
      { nom: "Élévations latérales haltères", series: [{ kg: 12, reps: 15 }, { kg: 12, reps: 13 }] },
    ],
  },
  {
    id: "s2",
    titre: "Legs",
    debutIso: "2026-09-18T18:15:00+02:00",
    dureeMin: 71,
    volumeKg: 11250,
    exercices: [{ nom: "Squat barre", series: [{ kg: 110, reps: 6 }, { kg: 120, reps: 5, record: true }] }],
  },
];
```

- [ ] **Étape 6 : Écrire l'écran**

`apps/web/src/routes/seances.tsx` :

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/shell/app-shell";
import { DetailSeance } from "@/features/seances/detail-seance";
import { ListeSeances } from "@/features/seances/liste-seances";
import { SEANCES } from "@/mocks/seances";

const recherche = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/seances")({
  validateSearch: recherche,
  component: PageSeances,
});

function PageSeances() {
  const { id } = Route.useSearch();
  const navigate = Route.useNavigate();

  const selectionnee = id ? SEANCES.find((s) => s.id === id) : undefined;

  return (
    <AppShell
      liste={
        <ListeSeances
          seances={SEANCES}
          idSelectionne={id}
          onSelection={(sId) => navigate({ search: () => ({ id: sId }) })}
        />
      }
      detail={
        selectionnee ? (
          <DetailSeance
            seance={selectionnee}
            onFermer={() => navigate({ search: () => ({}) })}
          />
        ) : undefined
      }
    />
  );
}
```

`apps/web/src/features/seances/liste-seances.tsx` — le fuseau est en dur ici parce qu'il n'y a pas encore de profil ; au lot 7 il viendra des préférences du compte.

```tsx
import { formatJour } from "@better-lift/shared";
import type { SeanceFactice } from "@/mocks/seances";
import { EtatVide } from "@/components/etats/etat-vide";

const FUSEAU = "Europe/Paris";

type Props = {
  seances: SeanceFactice[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
};

export function ListeSeances({ seances, idSelectionne, onSelection }: Props) {
  const antechronologiques = [...seances].sort(
    (a, b) => new Date(b.debutIso).getTime() - new Date(a.debutIso).getTime(),
  );

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-baseline gap-2.5 border-b border-(--line) px-5 pb-3.5 pt-4">
        <h1 className="text-lg font-semibold tracking-tight">Séances</h1>
        <span className="font-mono text-xs text-(--ink-subtle)">{seances.length}</span>
      </header>

      {antechronologiques.length === 0 ? (
        <EtatVide
          titre="Aucune séance"
          message="Ton historique se remplira au fil de tes entraînements. Démarre une séance depuis une routine ou à vide."
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {antechronologiques.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelection(s.id)}
                aria-current={s.id === idSelectionne ? "true" : undefined}
                className={`flex h-[62px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                  s.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-(--ink)">{s.titre}</span>
                  <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                    {formatJour(s.debutIso, FUSEAU)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-(--ink-subtle)">
                  {s.dureeMin} min · {(s.volumeKg / 1000).toFixed(1).replace(".", ",")} t
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

`apps/web/src/features/seances/detail-seance.tsx` :

```tsx
import { formatJour } from "@better-lift/shared";
import type { SeanceFactice } from "@/mocks/seances";
import { BadgeRecord } from "@/features/exercices/badge-record";

const FUSEAU = "Europe/Paris";

export function DetailSeance({
  seance,
  onFermer,
}: {
  seance: SeanceFactice;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{seance.titre}</h2>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {formatJour(seance.debutIso, FUSEAU)} · {seance.dureeMin} min
          </p>
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le panneau de détail"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-(--line) text-(--ink-subtle)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-auto px-5 py-4">
        {seance.exercices.map((ex) => (
          <div key={ex.nom}>
            <p className="mb-2 text-sm font-medium text-(--ink)">{ex.nom}</p>
            <ul className="flex flex-col gap-1">
              {ex.series.map((serie, i) => (
                <li
                  key={`${ex.nom}-${i}`}
                  className="flex items-center gap-3 rounded-md bg-(--surface-2) px-3 py-2"
                >
                  <span className="w-5 shrink-0 font-mono text-xs text-(--ink-faint)">{i + 1}</span>
                  <span className="flex-1 font-mono text-sm text-(--ink-muted)">
                    {String(serie.kg).replace(".", ",")} kg × {serie.reps}
                  </span>
                  {serie.record ? <BadgeRecord kg={serie.kg} reps={serie.reps} /> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Étape 7 : Éprouver le piège à l'écran**

La séance `s1` commence à **23 h 30 heure de Paris**. Elle doit s'afficher au **20 septembre**. Si elle apparaît au 21, c'est qu'une conversion UTC s'est glissée quelque part — c'est exactement le défaut que le test de l'étape 1 attrape, et qu'un affichage naïf réintroduit.

- [ ] **Étape 8 : Vérification complète**

```bash
pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm knip
```

Les cinq doivent passer. En cas de `TS2724 : has no exported member` visant un symbole présent dans la source, c'est un `.tsbuildinfo` périmé : reconstruire de bas en haut.

```bash
pnpm --filter @better-lift/shared exec tsc --build --force
```

- [ ] **Étape 9 : Ouvrir la PR du lot 2**

```bash
git add -A
git commit -m "feat(web): écran historique et arithmétique civile dans shared"
git push -u origin feat/lot-2-ecrans
gh pr create --fill --base main
gh pr checks --watch
```

---

## Écart assumé avec la spec : `packages/api-client`

La spec § 3 prévoit un paquet `packages/api-client` partagé entre le web et le mobile. **Ce plan ne le crée pas**, et c'est délibéré.

Aux lots 0 à 2, une seule surface consomme des routes typées : le web, pour `/health`. Le mobile fait un `fetch` nu sur la même route, et aucun écran ne touche encore à une API métier. Extraire un paquet partagé maintenant reviendrait à créer une frontière pour un seul consommateur — exactement le genre de machinerie que le redémarrage cherche à éviter.

Le client RPC vit donc dans `apps/web/src/lib/api.ts` jusqu'au **lot 4**, où le catalogue donne aux deux surfaces les mêmes routes à consommer. L'extraction sera alors mécanique : le fichier déménage, les deux applications l'importent. C'est à ce moment-là que le paquet gagne sa raison d'être, et pas avant.

## Ce que ce plan ne couvre pas

Volontairement hors périmètre, pour les raisons données dans la spec § 11 : l'authentification et la liste blanche (lot 3), la traduction du catalogue et son API (lot 4), les routines côté serveur (lot 5), les écrans mobiles et la séance (lot 6), l'historique réel et les records dérivés (lot 7).

Les lots 3 à 7 seront planifiés **après** le lot 2, parce qu'ils dépendent de ce que le dessin des écrans aura appris. Un plan écrit pour le lot 6 aujourd'hui serait périmé avant d'être utile.
