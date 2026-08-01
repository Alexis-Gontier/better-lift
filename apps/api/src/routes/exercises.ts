// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import {
  apiErrorSchema,
  createExerciseSchema,
  exerciseDetailQuerySchema,
  exerciseDetailSchema,
  exerciseListQuerySchema,
  exerciseListResponseSchema,
  updateExerciseSchema,
} from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import {
  archiveExercise,
  createExercise,
  getExerciseById,
  listExercises,
  updateExercise,
} from "../services/exercise.service.js";

const unauthenticated = {
  description: "Session absente ou expirée.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const invalidBody = {
  description: "Corps invalide.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const idParam = z.object({ id: z.string().min(1) });

const listRoute = createRoute({
  method: "get",
  path: "/v1/exercises",
  tags: ["Exercices"],
  summary: "Catalogue d'exercices",
  description:
    "Recherche plein texte sur le nom traduit, filtres cumulables et pagination " +
    "par curseur. Le tri comme la recherche portent sur la locale demandée, pas " +
    "sur le nom de base du catalogue. La liste mêle le catalogue commun et les " +
    "exercices personnalisés de l'utilisateur ; `custom` permet de n'en garder " +
    "qu'une des deux origines.",
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
    params: idParam,
    query: exerciseDetailQuerySchema,
  },
  responses: {
    200: {
      description: "Exercice trouvé.",
      content: { "application/json": { schema: exerciseDetailSchema } },
    },
    401: unauthenticated,
    404: {
      description: "Exercice inexistant, archivé, ou appartenant à autrui.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

const postRoute = createRoute({
  method: "post",
  path: "/v1/exercises",
  tags: ["Exercices"],
  summary: "Créer un exercice personnalisé",
  description:
    "L'exercice n'appartient qu'à son auteur et n'apparaît dans aucun autre " +
    "catalogue. Il n'a **aucun média** : les visuels du catalogue viennent d'un " +
    "dataset sous licence (D17) et rien n'héberge d'image d'utilisateur. Le nom " +
    "saisi est écrit à l'identique dans chaque locale servie, sans quoi " +
    "l'exercice disparaîtrait dès que le profil change de langue.",
  request: {
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: createExerciseSchema } },
    },
  },
  responses: {
    201: {
      description: "Exercice créé.",
      content: { "application/json": { schema: exerciseDetailSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

const patchRoute = createRoute({
  method: "patch",
  path: "/v1/exercises/{id}",
  tags: ["Exercices"],
  summary: "Modifier un exercice personnalisé",
  description:
    "Mise à jour partielle, réservée à ses propres exercices. Le corps est " +
    "strict : un champ inconnu renvoie 422 plutôt que d'être ignoré en silence.",
  request: {
    params: idParam,
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: updateExerciseSchema } },
    },
  },
  responses: {
    200: {
      description: "Exercice modifié.",
      content: { "application/json": { schema: exerciseDetailSchema } },
    },
    401: unauthenticated,
    403: {
      description: "Exercice du catalogue commun : non modifiable.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    404: {
      description: "Exercice inexistant ou appartenant à autrui.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    422: invalidBody,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/v1/exercises/{id}",
  tags: ["Exercices"],
  summary: "Archiver un exercice personnalisé",
  description:
    "L'exercice est **archivé**, jamais supprimé : une séance passée peut le " +
    "référencer et l'historique ne doit pas changer rétroactivement " +
    "(invariant 8, doc 03). Il disparaît du catalogue et des recherches.",
  request: { params: idParam },
  responses: {
    204: { description: "Exercice archivé." },
    401: unauthenticated,
    403: {
      description: "Exercice du catalogue commun : non archivable.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    404: {
      description: "Exercice inexistant ou appartenant à autrui.",
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
  // L'utilisateur vient de la session, jamais de la requête (doc 02) : c'est ce
  // qui rend impossible de lister les exercices de quelqu'un d'autre.
  return c.json(await listExercises(c.req.valid("query"), c.get("user").id), 200);
});

exercisesRouter.openapi(postRoute, async (c) => {
  const { locale } = c.req.valid("query");

  return c.json(await createExercise(c.req.valid("json"), c.get("user").id, locale), 201);
});

exercisesRouter.openapi(patchRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  return c.json(await updateExercise(id, c.req.valid("json"), c.get("user").id, locale), 200);
});

exercisesRouter.openapi(deleteRoute, async (c) => {
  await archiveExercise(c.req.valid("param").id, c.get("user").id);

  return c.body(null, 204);
});

exercisesRouter.openapi(detailRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  const exercise = await getExerciseById(id, locale, c.get("user").id);

  if (!exercise) {
    throw notFound("Exercice");
  }

  return c.json(exercise, 200);
});
