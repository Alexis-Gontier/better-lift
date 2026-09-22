import "./env.js";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { health } from "./routes/health.js";

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

const routes = app.route("/health", health);

export type AppType = typeof routes;
export default app;
