import { defineConfig } from "vitest/config";

/**
 * Les tests du web portent, à ce stade, sur la logique non graphique : le garde
 * de redirection et `proxy.ts`. Testing Library viendra avec les composants qui
 * la justifient (doc 07).
 */
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
  resolve: {
    // Même alias que `tsconfig.json` : sans lui, `@/…` ne résout pas hors de Next.
    alias: { "@": new URL("./src/", import.meta.url).pathname },
  },
});
