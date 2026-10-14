import "./env.js";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth.js";
import { routesExercices } from "./routes/exercices.js";
import { routesExport } from "./routes/export.js";
import { health } from "./routes/health.js";
import { routesPreferences } from "./routes/preferences.js";
import { routesRecords } from "./routes/records.js";
import { routesRoutines } from "./routes/routines.js";
import { routesSeances } from "./routes/seances.js";
import { routesStats } from "./routes/stats.js";
import { depotPreferences } from "./services/preferences.js";
import { depotPrisma as depotRoutines } from "./services/routines.js";
import { depotLecture, depotPrisma as depotSeances } from "./services/seances.js";
import { depotStats } from "./services/stats.js";

// Ce module construit l'app, sans aucun effet de bord (pas de `serve()`) : il
// peut donc être importé tel quel par les tests, y compris pour vérifier le
// montage des routes et les en-têtes CORS de l'app composée. Le serveur HTTP
// réel vit dans `index.ts`.
const app = new Hono();

app.use(logger());
app.use(secureHeaders());
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    credentials: true,
  }),
);

// Toute réponse d'erreur garde la forme `{ erreur }` des routes : les clients la
// lisent. Une `HTTPException` (levée exprès, par Hono ou un middleware) garde son
// code et son message ; toute autre exception est un défaut — journalisée en
// entier, mais jamais détaillée au client.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ erreur: err.message || "Requête refusée." }, err.status);
  }
  console.error(`[api] ${c.req.method} ${c.req.path}`, err);
  return c.json({ erreur: "Erreur interne du serveur." }, 500);
});

app.notFound((c) => c.json({ erreur: "Ressource introuvable." }, 404));

// Better Auth gère lui-même ses routes : elles ne passent pas par le RPC Hono,
// et n'apparaissent donc pas dans `AppType`. Le client web a son propre client
// d'authentification pour les joindre.
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Le lecteur de session réel : Better Auth, qui accepte le cookie du web et le
// jeton porteur du mobile.
const lireSession = (headers: Headers) => auth.api.getSession({ headers });

const routes = app
  .route("/health", health)
  // Les routes personnelles d'abord : `/exercices/pratiques` passerait sinon par le
  // `/:slug` public du catalogue.
  .route("/exercices", routesRecords(depotLecture, lireSession))
  .route("/exercices", routesExercices())
  .route("/routines", routesRoutines(depotRoutines, lireSession))
  .route("/seances", routesSeances(depotSeances, depotLecture, lireSession))
  .route("/stats", routesStats(depotStats, lireSession))
  .route("/preferences", routesPreferences(depotPreferences, lireSession))
  .route("/export", routesExport(depotLecture, lireSession));

export type AppType = typeof routes;
export default app;
