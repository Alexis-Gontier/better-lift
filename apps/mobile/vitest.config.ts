import { defineConfig } from "vitest/config";

/**
 * Les tests du mobile portent sur ce qui **n'a pas besoin d'un appareil** : le
 * brouillon de séance et sa traduction en corps d'API. C'est aussi ce qui porte
 * le risque — une erreur là perd un entraînement, alors qu'une erreur de style
 * se voit.
 *
 * Rien qui touche React Native n'est testé ici : il faudrait un environnement
 * complet et cela ne prouverait toujours rien sur le rendu réel. Le
 * comportement à l'écran se vérifie sur un development build.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.expo/**"],
  },
  resolve: {
    // Même alias que `tsconfig.json` : sans lui, `@/…` ne résout pas hors Metro.
    alias: { "@": new URL("./src/", import.meta.url).pathname },
  },
});
