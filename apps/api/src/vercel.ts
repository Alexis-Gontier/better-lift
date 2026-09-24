import { getRequestListener } from "@hono/node-server";
import app from "./app.js";

/**
 * Le point d'entrée de production : UNE fonction Vercel, sous `/api`, sur la
 * même origine que le web (D18) — donc aucun CORS.
 *
 * Le web occupe la racine (`/exercices`, `/routines` sont des PAGES), l'API est
 * donc servie sous `/api`. L'application Hono, elle, ne connaît pas ce préfixe :
 * on le retire ici. Sauf pour Better Auth, qui vit sous `/api/auth` des deux
 * côtés — ses URL de rappel restent justes sans configuration de plus.
 *
 * Vercel réécrit « /api/<reste> » en « /api?__chemin=<reste> » (voir
 * `scripts/construire-vercel.mjs`) : le chemin d'origine se lit dans ce
 * paramètre, sans dépendre de ce que Vercel met dans `req.url`.
 */
export function cheminInterne(url: URL): URL {
  const u = new URL(url);
  const reecrit = u.searchParams.get("__chemin");
  u.searchParams.delete("__chemin");
  const externe = reecrit !== null ? `/api/${reecrit}` : u.pathname;

  if (externe === "/api/auth" || externe.startsWith("/api/auth/")) u.pathname = externe;
  else u.pathname = externe.replace(/^\/api/, "") || "/";
  return u;
}

export default getRequestListener((requete) => {
  const url = cheminInterne(new URL(requete.url));
  const corps = requete.method === "GET" || requete.method === "HEAD" ? undefined : requete.body;
  // `duplex: "half"` : exigé par Node dès qu'un corps en flux est transmis.
  return app.fetch(
    new Request(url, {
      method: requete.method,
      headers: requete.headers,
      body: corps,
      duplex: "half",
    } as RequestInit),
  );
});
