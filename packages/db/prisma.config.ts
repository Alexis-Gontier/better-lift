import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, "../../.env");

// En CI et sur Vercel, les variables sont injectées dans l'environnement et
// aucun `.env` n'existe sur disque : sans ce garde, loadEnvFile jette ENOENT.
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // L'URL DIRECTE : c'est cette clé que le CLI Prisma 7 utilise pour migrer.
    // Le runtime, lui, passe par le pooler via DATABASE_URL dans src/index.ts.
    url: env("DIRECT_URL"),
  },
});
