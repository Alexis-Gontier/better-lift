import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 : l'URL de connexion a quitté `schema.prisma` (doc 10).
 *
 * Le `.env` vit à la racine du monorepo, pas dans ce package : la CLI Prisma
 * s'exécute avec `packages/db` pour répertoire courant, donc on charge les
 * deux chemins, le plus spécifique l'emportant.
 */
loadEnv({ path: [".env", "../../.env"], quiet: true });

/**
 * Sur Neon, la connexion poolée (`-pooler`) convient au runtime mais pas aux
 * migrations, qui ont besoin d'une session stable : `DIRECT_URL` est la
 * connexion directe, `DATABASE_URL` la poolée. En Postgres local, les deux
 * sont identiques et `DIRECT_URL` peut rester vide.
 */
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

/**
 * Le bloc `datasource` n'est ajouté que si l'URL existe : `prisma generate` ne
 * se connecte à rien et doit fonctionner sans base — c'est exactement le cas
 * de la CI, qui génère le client avant de linter (doc 07). Les commandes de
 * migration, elles, échoueront explicitement si l'URL manque.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7 ne lance plus le seed pendant les migrations : il est déclaré
    // ici et appelé explicitement par `pnpm db:seed`.
    seed: "tsx seed/index.ts",
  },
  ...(migrationUrl
    ? {
        datasource: {
          url: migrationUrl,
          ...(process.env.SHADOW_DATABASE_URL
            ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
            : {}),
        },
      }
    : {}),
});
