// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import {
  apiErrorSchema,
  exerciseDetailQuerySchema,
  exerciseDetailSchema,
  exerciseListQuerySchema,
  exerciseListResponseSchema,
} from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import { getExerciseById, listExercises } from "../services/exercise.service.js";

const listRoute = createRoute({
  method: "get",
  path: "/v1/exercises",
  tags: ["Exercices"],
  summary: "Catalogue d'exercices",
  description:
    "Recherche plein texte sur le nom traduit, filtres cumulables et pagination " +
    "par curseur. Le tri comme la recherche portent sur la locale demandée, pas " +
    "sur le nom de base du catalogue.",
  request: { query: exerciseListQuerySchema },
  responses: {
    200: {
      description: "Page de résultats.",
      content: { "application/json": { schema: exerciseListResponseSchema } },
    },
    401: {
      description: "Session absente ou expirée.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    422: {
      description: "Paramètres invalides.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

const detailRoute = createRoute({
  method: "get",
  path: "/v1/exercises/{id}",
  tags: ["Exercices"],
  summary: "Fiche d'un exercice",
  description:
    "Ajoute au résumé les instructions numérotées dans la locale demandée. " +
    "Un exercice archivé répond 404 : il ne fait plus partie du catalogue.",
  request: {
    params: z.object({ id: z.string().min(1) }),
    query: exerciseDetailQuerySchema,
  },
  responses: {
    200: {
      description: "Exercice trouvé.",
      content: { "application/json": { schema: exerciseDetailSchema } },
    },
    401: {
      description: "Session absente ou expirée.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    404: {
      description: "Exercice inexistant ou archivé.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

export const exercisesRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

// Le catalogue est commun à tous, mais il n'est pas public : comme toute route
// `/v1/*`, il exige une session (doc 04).
exercisesRouter.use("/v1/exercises", requireAuth);
exercisesRouter.use("/v1/exercises/*", requireAuth);

exercisesRouter.openapi(listRoute, async (c) => {
  return c.json(await listExercises(c.req.valid("query")), 200);
});

exercisesRouter.openapi(detailRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  const exercise = await getExerciseById(id, locale);

  if (!exercise) {
    throw notFound("Exercice");
  }

  return c.json(exercise, 200);
});
