// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { apiErrorSchema, currentUserSchema, updateMeSchema } from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import { getCurrentUser, updateCurrentUser } from "../services/me.service.js";

const unauthenticated = {
  description: "Session absente ou expirée.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const getMeRoute = createRoute({
  method: "get",
  path: "/v1/me",
  tags: ["Compte"],
  summary: "Profil et préférences de l'utilisateur connecté",
  description:
    "Première route protégée du projet. Elle ne lit aucun identifiant dans la " +
    "requête : l'utilisateur vient de la session, résolue par Better Auth " +
    "depuis le cookie (web) ou le bearer token (mobile).",
  responses: {
    200: {
      description: "Session valide.",
      content: { "application/json": { schema: currentUserSchema } },
    },
    401: unauthenticated,
  },
});

const patchMeRoute = createRoute({
  method: "patch",
  path: "/v1/me",
  tags: ["Compte"],
  summary: "Modifier son profil et ses préférences",
  description:
    "Mise à jour partielle. `username` et `bio` acceptent `null` pour être " +
    "effacés. Le corps est strict : un champ inconnu renvoie 422 plutôt que " +
    "d'être ignoré en silence, un réglage cru enregistré étant pire qu'une erreur.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: updateMeSchema } },
    },
  },
  responses: {
    200: {
      description: "Profil mis à jour.",
      content: { "application/json": { schema: currentUserSchema } },
    },
    401: unauthenticated,
    409: {
      description: "Le pseudo demandé est déjà pris.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    422: {
      description: "Corps invalide.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

export const meRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

meRouter.use("/v1/me", requireAuth);

meRouter.openapi(getMeRoute, async (c) => {
  return c.json(await getCurrentUser(c.get("user").id), 200);
});

meRouter.openapi(patchMeRoute, async (c) => {
  return c.json(await updateCurrentUser(c.get("user").id, c.req.valid("json")), 200);
});
