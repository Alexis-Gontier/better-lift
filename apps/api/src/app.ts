import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { type AppEnv, auth } from "./lib/auth.js";
import { env } from "./lib/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { exercisesRouter } from "./routes/exercises.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";

/**
 * Construit l'application sans l'écouter : `index.ts` s'occupe du serveur,
 * les tests instancient directement cette fonction.
 */
export function createApp(): OpenAPIHono<AppEnv> {
  const app = new OpenAPIHono<AppEnv>();

  app.use("*", requestId());
  app.use("*", logger());
  app.use("*", secureHeaders());
  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  /**
   * Better Auth sert tout le cycle de vie sur `/api/auth/*` (doc 04) :
   * inscription, connexion, callback OAuth, déconnexion. Le handler prend la
   * requête web brute, il n'y a rien à traduire.
   *
   * Monté avant les routes applicatives et hors du contrat OpenAPI : Better
   * Auth publie le sien via son plugin `openAPI`, si on en a besoin un jour.
   */
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.route("/", healthRouter);
  app.route("/", meRouter);
  app.route("/", exercisesRouter);

  // Contrat OpenAPI publiable — le bénéfice attendu de @hono/zod-openapi (D1).
  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "better-lift API",
      version: env.APP_VERSION,
      description: "API unique du web et du mobile (doc 04).",
    },
  });

  return app;
}
