import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration distincte de `vite.config.ts`, que Vitest ignore dès qu'un
// `vitest.config.ts` existe : les tests n'ont besoin ni du greffon de routes,
// ni de React, ni de Tailwind. L'alias, lui, doit être répété — il ne vient
// pas de `tsconfig.json`.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
