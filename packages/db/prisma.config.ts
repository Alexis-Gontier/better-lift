import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

// Prisma 7 ne charge plus le `.env` automatiquement, et celui du monorepo
// vit à la racine (deux niveaux au-dessus de packages/db).
const here = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(here, "../../.env"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
});
