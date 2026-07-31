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

## Instanciation

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });
```

`new PrismaClient()` sans adaptateur échoue. `import { PrismaClient } from "@prisma/client"` échoue.

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
