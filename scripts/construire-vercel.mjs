// @ts-check
/**
 * Construit le déploiement Vercel au format « Build Output API » (v3), sans
 * dépendre de la détection automatique de Vercel.
 *
 *   .vercel/output/static/            le SPA web
 *   .vercel/output/functions/api.func l'API, EN UN SEUL FICHIER (esbuild)
 *   .vercel/output/config.json        les routes
 *
 * Pourquoi tout faire à la main : l'API importe des paquets du dépôt en
 * TypeScript source (`./x.js` pour `x.ts`). Un seul bundle esbuild résout tout
 * cela ici, de façon déterministe — et se teste en local avec
 * `scripts/essayer-vercel.mjs` avant tout déploiement.
 */
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const SORTIE = ".vercel/output";
const FONCTION = `${SORTIE}/functions/api.func`;
const executer = (/** @type {string} */ cmd) => execSync(cmd, { stdio: "inherit" });

rmSync(SORTIE, { recursive: true, force: true });

// Le client Prisma est généré, pas commité : il doit exister avant le bundle.
executer("pnpm --filter @better-lift/db generate");
executer("pnpm --filter @better-lift/web build");
cpSync("apps/web/dist", `${SORTIE}/static`, { recursive: true });

mkdirSync(FONCTION, { recursive: true });
await build({
  entryPoints: ["apps/api/src/vercel.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: `${FONCTION}/index.mjs`,
  // Certaines dépendances sont en CommonJS et appellent `require` : en ESM,
  // il faut le recréer.
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  logLevel: "info",
});
writeFileSync(
  `${FONCTION}/.vc-config.json`,
  JSON.stringify({
    runtime: "nodejs22.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    shouldAddHelpers: false,
  }),
);

writeFileSync(
  `${SORTIE}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      // « /api/<reste> » → la fonction, le reste passé en paramètre : voir
      // `cheminInterne` dans apps/api/src/vercel.ts.
      { src: "^/api/(.*)$", dest: "/api?__chemin=$1" },
      { handle: "filesystem" },
      // SPA : toute autre route rend index.html, TanStack Router fait le reste.
      { src: "/(.*)", dest: "/index.html" },
    ],
  }),
);

console.log(`Déploiement construit dans ${SORTIE}`);
