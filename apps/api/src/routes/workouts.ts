// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import {
  apiErrorSchema,
  createWorkoutSchema,
  exerciseDetailQuerySchema,
  lastPerformanceQuerySchema,
  lastPerformanceResponseSchema,
  workoutDetailSchema,
  workoutListQuerySchema,
  workoutListResponseSchema,
  workoutSaveResponseSchema,
  workoutStructureSchema,
} from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createWorkout,
  deleteWorkout,
  getLastPerformance,
  getWorkout,
  listWorkouts,
  updateWorkout,
} from "../services/workout.service.js";

const unauthenticated = {
  description: "Session absente ou expirée.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const invalidBody = {
  description:
    "Corps invalide, ou exercice référencé introuvable — un exercice " +
    "personnalisé d'autrui en fait partie.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const workoutNotFound = {
  description: "Séance inexistante ou appartenant à autrui.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const idParam = z.object({ id: z.string().min(1) });

const listRoute = createRoute({
  method: "get",
  path: "/v1/workouts",
  tags: ["Séances"],
  summary: "Historique des séances",
  description:
    "Antéchronologique, paginé **par curseur** : l'historique s'insère par le " +
    "haut, et un offset ferait revoir ou sauter une ligne dès qu'une séance " +
    "est enregistrée entre deux pages. Les agrégats affichés sur chaque carte " +
    "sont dénormalisés en base, aucune série n'est parcourue ici.",
  request: { query: workoutListQuerySchema },
  responses: {
    200: {
      description: "Page d'historique.",
      content: { "application/json": { schema: workoutListResponseSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

const lastPerformanceRoute = createRoute({
  method: "get",
  path: "/v1/workouts/last-performance",
  tags: ["Séances"],
  summary: "Dernières valeurs par exercice",
  description:
    "Alimente la colonne « PRÉC. » de l'écran de saisie : les valeurs de la " +
    "dernière séance sur chaque exercice, qui pré-remplissent les champs. " +
    "Appelée **une fois** au démarrage d'une séance, avec tous les exercices " +
    "de la routine — une requête par exercice ferait dix allers-retours au " +
    "moment précis où l'utilisateur attend devant sa barre. Un exercice " +
    "jamais fait est absent de la réponse.",
  request: { query: lastPerformanceQuerySchema },
  responses: {
    200: {
      description: "Dernières performances connues.",
      content: { "application/json": { schema: lastPerformanceResponseSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

const detailRoute = createRoute({
  method: "get",
  path: "/v1/workouts/{id}",
  tags: ["Séances"],
  summary: "Détail d'une séance",
  description: "Structure complète, exercices et séries réalisées comprises.",
  request: { params: idParam, query: exerciseDetailQuerySchema },
  responses: {
    200: {
      description: "Séance trouvée.",
      content: { "application/json": { schema: workoutDetailSchema } },
    },
    401: unauthenticated,
    404: workoutNotFound,
  },
});

const postRoute = createRoute({
  method: "post",
  path: "/v1/workouts",
  tags: ["Séances"],
  summary: "Enregistrer une séance terminée",
  description:
    "**Idempotent** : l'identifiant est généré par le client, et un `id` déjà " +
    "connu renvoie `200` avec la séance existante au lieu de `201`. Sans " +
    "cela, une reconnexion réseau au mauvais moment crée un doublon — c'est " +
    "le bug numéro un des trackers de sport, et une file de synchronisation " +
    "hors ligne le rend inévitable.\n\n" +
    "Les agrégats et les **records sont calculés serveur** dans la " +
    "transaction, à partir des seules séries validées et non d'échauffement. " +
    "Les records battus sont renvoyés dans `newRecords`.",
  request: {
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: createWorkoutSchema } },
    },
  },
  responses: {
    200: {
      description: "Séance déjà enregistrée : renvoyée telle quelle, sans doublon.",
      content: { "application/json": { schema: workoutSaveResponseSchema } },
    },
    201: {
      description: "Séance enregistrée.",
      content: { "application/json": { schema: workoutSaveResponseSchema } },
    },
    401: unauthenticated,
    404: {
      description: "Routine d'origine inexistante ou appartenant à autrui.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    409: {
      description: "Identifiant déjà utilisé par la séance de quelqu'un d'autre.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    422: invalidBody,
  },
});

const putRoute = createRoute({
  method: "put",
  path: "/v1/workouts/{id}",
  tags: ["Séances"],
  summary: "Corriger une séance passée",
  description:
    "**Remplacement intégral** de la structure, comme pour une routine. La " +
    "correction déclenche un **recalcul complet** des records de chaque " +
    "exercice touché, reconstruit depuis l'historique : corriger à la baisse " +
    "peut invalider un record, et il faut alors retrouver le second meilleur " +
    "— ce qu'un ajustement incrémental n'a aucun moyen de connaître.\n\n" +
    "Les compteurs de la routine d'origine ne bougent pas : la séance a eu " +
    "lieu, la corriger ne la fait pas avoir lieu une seconde fois.",
  request: {
    params: idParam,
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: workoutStructureSchema } },
    },
  },
  responses: {
    200: {
      description: "Séance corrigée.",
      content: { "application/json": { schema: workoutSaveResponseSchema } },
    },
    401: unauthenticated,
    404: workoutNotFound,
    422: invalidBody,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/v1/workouts/{id}",
  tags: ["Séances"],
  summary: "Supprimer une séance",
  description:
    "Suppression **physique**, contrairement aux routines : quelqu'un qui " +
    "supprime une séance veut qu'elle disparaisse. Les records qu'elle " +
    "détenait sont reconstruits derrière elle.",
  request: { params: idParam },
  responses: {
    204: { description: "Séance supprimée." },
    401: unauthenticated,
    404: workoutNotFound,
  },
});

export const workoutsRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

workoutsRouter.use("/v1/workouts", requireAuth);
workoutsRouter.use("/v1/workouts/*", requireAuth);

// `last-performance` avant `{id}` : déclarée après, elle serait avalée par la
// route de détail, qui accepte n'importe quel identifiant.
workoutsRouter.openapi(lastPerformanceRoute, async (c) => {
  const data = await getLastPerformance(c.req.valid("query"), c.get("user").id);

  return c.json({ data }, 200);
});

workoutsRouter.openapi(listRoute, async (c) => {
  // L'utilisateur vient de la session, jamais de la requête (doc 02).
  return c.json(await listWorkouts(c.req.valid("query"), c.get("user").id), 200);
});

workoutsRouter.openapi(postRoute, async (c) => {
  const { locale } = c.req.valid("query");

  const { workout, created } = await createWorkout(c.req.valid("json"), c.get("user").id, locale);

  // 200 sur un renvoi, 201 sur une création : c'est ce qui distingue le
  // deuxième envoi du premier pour un client qui compte ses séances.
  return created ? c.json(workout, 201) : c.json(workout, 200);
});

workoutsRouter.openapi(putRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  return c.json(await updateWorkout(id, c.req.valid("json"), c.get("user").id, locale), 200);
});

workoutsRouter.openapi(deleteRoute, async (c) => {
  await deleteWorkout(c.req.valid("param").id, c.get("user").id);

  return c.body(null, 204);
});

workoutsRouter.openapi(detailRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  const workout = await getWorkout(id, c.get("user").id, locale);

  if (!workout) {
    throw notFound("Séance");
  }

  return c.json(workout, 200);
});
