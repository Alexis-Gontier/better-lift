/**
 * Tailwind 4 : configuration CSS-first, ce fichier est le seul réglage.
 *
 * Il vit ici plutôt que dans `apps/web` parce que la feuille de style vit ici :
 * `apps/web/postcss.config.mjs` le réexporte via l'export `./postcss.config`.
 */
export default {
  plugins: ["@tailwindcss/postcss"],
};
