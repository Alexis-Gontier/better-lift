// @ts-check
/**
 * Rejoue en local le routage de `.vercel/output/config.json`, pour éprouver le
 * déploiement AVANT de l'envoyer :
 *
 *   BETTER_AUTH_URL=http://localhost:4000 node --env-file=.env scripts/essayer-vercel.mjs
 *
 * `/api/*` → la fonction bundlée, avec la même réécriture que Vercel ; le reste →
 * les fichiers statiques, puis l'index.html de `/app` (SPA) ; `/` redirige vers `/app`.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const RACINE = ".vercel/output";
const { default: fonction } = await import(
  pathToFileURL(`${RACINE}/functions/api.func/index.mjs`).href
);
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const api = url.pathname.match(/^\/api\/(.*)$/);
  if (api) {
    // Comme Vercel : la destination porte le chemin en paramètre, et les
    // paramètres d'origine sont conservés.
    url.searchParams.set("__chemin", api[1] ?? "");
    req.url = `/api?${url.searchParams}`;
    return fonction(req, res);
  }
  if (url.pathname === "/") {
    res.writeHead(307, { location: "/app" });
    return res.end();
  }
  const fichier = path.join(RACINE, "static", url.pathname);
  const cible =
    existsSync(fichier) && statSync(fichier).isFile()
      ? fichier
      : path.join(RACINE, "static", "app", "index.html");
  res.writeHead(200, {
    "content-type":
      TYPES[/** @type {keyof typeof TYPES} */ (path.extname(cible))] ?? "application/octet-stream",
  });
  res.end(readFileSync(cible));
}).listen(4000, () => console.log("Déploiement local sur http://localhost:4000"));
