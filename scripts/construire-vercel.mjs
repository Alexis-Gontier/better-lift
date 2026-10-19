// @ts-check
/**
 * Construit le déploiement Vercel au format « Build Output API » (v3), sans
 * dépendre de la détection automatique de Vercel.
 *
 *   .vercel/output/static/app/        le SPA web, sous /app (la racine ira à la landing)
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

// Lue AVANT la valeur factice ci-dessous : seule une vraie URL peut migrer.
// biome-ignore lint/suspicious/noUndeclaredEnvVars: lancé par Vercel, hors de turbo.
const urlDirecte = process.env.DIRECT_URL;

// Le client Prisma est généré, pas commité : il doit exister avant le bundle.
// `prisma.config.ts` exige DIRECT_URL, que seule la production fournit (pour
// migrer, plus bas ; le runtime ne lit que DATABASE_URL) : `generate` ne contacte
// jamais la base, une URL factice suffit — comme en CI. Une vraie valeur l'emporte.
process.env.DIRECT_URL ??= "postgresql://build:build@localhost:5432/build";
executer("pnpm --filter @better-lift/db generate");
executer("pnpm --filter @better-lift/web build");
cpSync("apps/web/dist", `${SORTIE}/static/app`, { recursive: true });

mkdirSync(FONCTION, { recursive: true });
await build({
  entryPoints: ["apps/api/src/vercel.ts"],
  bundle: true,
  platform: "node",
  target: "node24",
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
    runtime: "nodejs24.x",
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
      // En attendant la landing, la racine mène à l'application.
      { src: "^/$", status: 307, headers: { Location: "/app" } },
      // SPA sous /app : toute route rend son index.html, TanStack Router fait le reste.
      { src: "^/app(/.*)?$", dest: "/app/index.html" },
    ],
  }),
);

// Les migrations partent avec le déploiement de PRODUCTION, et lui seul : une
// prévisualisation de PR migrerait la base de prod avant la fusion. En dernier,
// une fois tout construit : un build cassé ne touche pas la base. Sans URL
// directe, le build échoue plutôt que de déployer un code qui attend une
// colonne absente — l'ancien déploiement reste en ligne.
if (process.env.VERCEL_ENV === "production") {
  if (!urlDirecte) throw new Error("DIRECT_URL manque : la production ne peut pas migrer.");
  process.env.DIRECT_URL = urlDirecte;
  executer("pnpm --filter @better-lift/db exec prisma migrate deploy");
}

console.log(`Déploiement construit dans ${SORTIE}`);
