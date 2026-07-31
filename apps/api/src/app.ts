import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { env } from "./lib/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";

/**
 * Construit l'application sans l'écouter : `index.ts` s'occupe du serveur,
 * les tests instancient directement cette fonction.
 */
export function createApp(): OpenAPIHono {
  const app = new OpenAPIHono();

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

  app.route("/", healthRouter);

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
