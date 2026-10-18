import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Les identifiants du compte E2E (D304), hors du dépôt : `apps/web/.env.e2e`, ignoré par git.
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");

/**
 * De bout en bout, en local, contre l'API de développement (branche Neon `dev`) et le compte
 * `e2e@better-lift.local` (D304) — jamais `controle@`, qui porte la démo. Pas dans la CI : elle
 * n'a pas de base. Les serveurs déjà lancés (`pnpm dev`) sont repris tels quels.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3000/app/", trace: "retain-on-failure", locale: "fr-FR" },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/e2e.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @better-lift/api dev",
      url: "http://localhost:3001/health",
      reuseExistingServer: true,
      cwd: "../..",
    },
    {
      command: "pnpm --filter @better-lift/web dev",
      url: "http://localhost:3000/app/",
      reuseExistingServer: true,
      cwd: "../..",
    },
  ],
});
