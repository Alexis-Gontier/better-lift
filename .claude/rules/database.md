---
paths:
  - "packages/db/**"
  - "**/*.prisma"
  - "**/prisma.config.ts"
---

# Prisma 7 — configuration obligatoire

Le modèle a très probablement appris Prisma 6. **Tout ce qui suit contredit ce qu'il croit savoir.**

## Schéma

```prisma
generator client {
  provider = "prisma-client"           // PAS "prisma-client-js"
  output   = "../src/generated/prisma" // obligatoire en v7
}

datasource db {
  provider = "postgresql"
  // aucune url ici — elle vit dans prisma.config.ts
}
```

## Configuration

`packages/db/prisma.config.ts`, à la racine du package :

```ts
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Le .env vit à la racine du monorepo, la CLI Prisma tourne dans packages/db.
loadEnv({ path: [".env", "../../.env"], quiet: true });

// Neon : DIRECT_URL pour les migrations, DATABASE_URL (poolée) au runtime.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx seed/index.ts", // seed/ à la racine du package, pas sous prisma/
  },
  // Bloc conditionnel : `prisma generate` charge la config entière alors qu'il
  // ne se connecte à rien. Un `env("DATABASE_URL")` inconditionnel casse
  // `pnpm db:generate` en CI, où aucune base n'est branchée.
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
```

## Instanciation

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });
```

`new PrismaClient()` sans adaptateur échoue. `import { PrismaClient } from "@prisma/client"` échoue.

**Mais `@prisma/client` reste une dépendance obligatoire de `packages/db`** : le client généré importe `@prisma/client/runtime/client`. Sans lui, pnpm ne résout pas le runtime et **les types s'effondrent silencieusement en `{}`** — symptôme trompeur, des `TS7006 implicitly any` sur des callbacks pourtant bien typés.

Le client est instancié **paresseusement** (`Proxy` sur le premier accès) : sinon tout consommateur devrait garantir que son chargement de `.env` précède l'import du package, une contrainte d'ordre d'imports que le moindre tri automatique — celui de Biome, par exemple — casserait sans bruit.

## Autres ruptures v7

- `packages/db` est en ES module : `"type": "module"` dans son `package.json`.
- Le middleware client (`prisma.$use`) a été supprimé. Utiliser les extensions client.
- Le seed automatique pendant les migrations a été supprimé : `prisma db seed` doit être appelé explicitement, en local comme en CI.
- Les métriques ont été retirées.

## Règles de modélisation

- Charges et distances en `Decimal` avec précision explicite (`@db.Decimal(7,2)` pour une charge), **jamais** `Float`.
- Tout en métrique : kg, mètres, secondes, cm.
- `onDelete: Restrict` sur `Exercise` : on n'efface jamais un exercice référencé par un historique, on l'archive (`isArchived`).
- `onDelete: SetNull` sur `Workout.routineId` : supprimer une routine ne touche pas l'historique.
- Les agrégats de `Workout` (`totalVolumeKg`, `totalSets`, `durationSec`, `prCount`) sont dénormalisés et recalculés **à l'écriture**, dans la transaction. Jamais agrégés à la lecture.
- `position` est contigu à partir de 0. La contrainte `@@unique([parentId, position])` interdit les échanges naïfs : réécrire toutes les positions du parent dans la même transaction.

## Migrations

- Une migration par PR, nommée explicitement (`20260731_add_superset_group`).
- `prisma migrate dev` en local, `prisma migrate deploy` en CI. Jamais `db push` hors prototypage.
- Toute suppression de colonne passe par une phase intermédiaire : les clients mobiles en version ancienne restent en circulation des mois.

Détail complet du schéma : `docs/03-modele-de-donnees.md`. Ruptures de version : `docs/10-versions.md`.
