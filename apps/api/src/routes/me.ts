// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { apiErrorSchema, currentUserSchema } from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const meRoute = createRoute({
  method: "get",
  path: "/v1/me",
  tags: ["Authentification"],
  summary: "Utilisateur de la session courante",
  description:
    "Première route protégée du projet. Elle ne lit aucun identifiant dans la " +
    "requête : l'utilisateur vient de la session, résolue par Better Auth " +
    "depuis le cookie (web) ou le bearer token (mobile).",
  responses: {
    200: {
      description: "Session valide.",
      content: { "application/json": { schema: currentUserSchema } },
    },
    401: {
      description: "Session absente ou expirée.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

export const meRouter = new OpenAPIHono<AppEnv>();

meRouter.use("/v1/me", requireAuth);

meRouter.openapi(meRoute, (c) => {
  const user = c.get("user");

  return c.json(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    200,
  );
});
