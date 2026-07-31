// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { healthResponseSchema, versionResponseSchema } from "@better-lift/validators";

import { getHealth, getVersion } from "../services/health.service.js";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Santé"],
  summary: "État de l'API et de ses dépendances",
  description:
    "Renvoie 503 quand une dépendance est indisponible, pour que la supervision " +
    "n'ait pas à interpréter le corps de la réponse.",
  responses: {
    200: {
      description: "L'API et la base répondent.",
      content: { "application/json": { schema: healthResponseSchema } },
    },
    503: {
      description: "Une dépendance est indisponible.",
      content: { "application/json": { schema: healthResponseSchema } },
    },
  },
});

const versionRoute = createRoute({
  method: "get",
  path: "/v1/version",
  tags: ["Santé"],
  summary: "Versions des briques déployées",
  responses: {
    200: {
      description: "Versions de l'API et de la logique métier partagée.",
      content: { "application/json": { schema: versionResponseSchema } },
    },
  },
});

export const healthRouter = new OpenAPIHono();

healthRouter.openapi(healthRoute, async (c) => {
  const health = await getHealth();

  return c.json(health, health.status === "ok" ? 200 : 503);
});

healthRouter.openapi(versionRoute, (c) => c.json(getVersion(), 200));
