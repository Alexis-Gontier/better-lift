// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import {
  apiErrorSchema,
  exerciseDetailQuerySchema,
  reorderSchema,
  routineDetailSchema,
  routineListQuerySchema,
  routineListResponseSchema,
  routineStructureSchema,
  updateRoutineSchema,
} from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  getRoutine,
  listRoutines,
  reorderRoutines,
  replaceRoutine,
  updateRoutineMeta,
} from "../services/routine.service.js";

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

const routineNotFound = {
  description: "Routine inexistante, supprimée, ou appartenant à autrui.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const idParam = z.object({ id: z.string().min(1) });

const listRoute = createRoute({
  method: "get",
  path: "/v1/routines",
  tags: ["Routines"],
  summary: "Liste des routines",
  description:
    "**Non paginée**, contrairement au catalogue : le nombre de routines est " +
    "borné par l'effort de leur auteur, et l'écran les affiche toutes, " +
    "groupées par dossier. Un curseur imposerait une clé composite dès qu'on " +
    "trie par nom ou par dernière utilisation, deux colonnes non uniques.",
  request: { query: routineListQuerySchema },
  responses: {
    200: {
      description: "Routines de l'utilisateur.",
      content: { "application/json": { schema: routineListResponseSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

const detailRoute = createRoute({
  method: "get",
  path: "/v1/routines/{id}",
  tags: ["Routines"],
  summary: "Détail d'une routine",
  description:
    "Structure complète, exercices et séries cibles compris. Le résumé de " +
    "chaque exercice est **embarqué** dans la locale demandée : sans cela, " +
    "afficher une routine demanderait une requête par exercice.",
  request: { params: idParam, query: exerciseDetailQuerySchema },
  responses: {
    200: {
      description: "Routine trouvée.",
      content: { "application/json": { schema: routineDetailSchema } },
    },
    401: unauthenticated,
    404: routineNotFound,
  },
});

const postRoute = createRoute({
  method: "post",
  path: "/v1/routines",
  tags: ["Routines"],
  summary: "Créer une routine",
  description:
    "Avec ses exercices et ses séries cibles. **Le client n'envoie aucune " +
    "`position`** : l'ordre des tableaux la porte et le serveur l'assigne — " +
    "une source d'incohérence en moins. Un `supersetGroup` resté seul est " +
    "ramené à `null` (invariant 4) : à un seul exercice, ce n'est pas un " +
    "superset.",
  request: {
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: routineStructureSchema } },
    },
  },
  responses: {
    201: {
      description: "Routine créée.",
      content: { "application/json": { schema: routineDetailSchema } },
    },
    401: unauthenticated,
    404: {
      description: "Dossier visé inexistant.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    422: invalidBody,
  },
});

const putRoute = createRoute({
  method: "put",
  path: "/v1/routines/{id}",
  tags: ["Routines"],
  summary: "Remplacer la structure d'une routine",
  description:
    "**Remplacement intégral.** Pas de PATCH granulaire sur les " +
    "sous-ressources imbriquées — « la série 2 de l'exercice 3 » — qui " +
    "multiplierait les allers-retours et les états intermédiaires " +
    "incohérents. L'éditeur travaille sur un brouillon local et envoie " +
    "l'ensemble en une transaction. Les identifiants des exercices et des " +
    "séries changent donc à chaque enregistrement ; personne ne s'y réfère.",
  request: {
    params: idParam,
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: routineStructureSchema } },
    },
  },
  responses: {
    200: {
      description: "Routine remplacée.",
      content: { "application/json": { schema: routineDetailSchema } },
    },
    401: unauthenticated,
    404: routineNotFound,
    422: invalidBody,
  },
});

const patchRoute = createRoute({
  method: "patch",
  path: "/v1/routines/{id}",
  tags: ["Routines"],
  summary: "Modifier les métadonnées d'une routine",
  description:
    "Nom, notes, dossier — sans toucher à la structure. C'est le cas d'un " +
    "glisser-déposer entre dossiers, où l'éditeur n'est même pas ouvert.",
  request: {
    params: idParam,
    query: exerciseDetailQuerySchema,
    body: {
      required: true,
      content: { "application/json": { schema: updateRoutineSchema } },
    },
  },
  responses: {
    200: {
      description: "Routine modifiée.",
      content: { "application/json": { schema: routineDetailSchema } },
    },
    401: unauthenticated,
    404: routineNotFound,
    422: invalidBody,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/v1/routines/{id}",
  tags: ["Routines"],
  summary: "Supprimer une routine",
  description:
    "Suppression **logique** : la ligne reste en base parce qu'une séance " +
    "passée peut encore la désigner, et l'historique ne change jamais " +
    "rétroactivement (règle non négociable n°5).",
  request: { params: idParam },
  responses: {
    204: { description: "Routine supprimée." },
    401: unauthenticated,
    404: routineNotFound,
  },
});

const duplicateRoute = createRoute({
  method: "post",
  path: "/v1/routines/{id}/duplicate",
  tags: ["Routines"],
  summary: "Dupliquer une routine",
  description:
    "Copie suffixée « (copie) », dans le même dossier. Les compteurs " +
    "d'exécution ne sont pas repris : la copie n'a jamais été faite, et les " +
    "hériter fausserait le tri « dernière utilisée ».",
  request: { params: idParam, query: exerciseDetailQuerySchema },
  responses: {
    201: {
      description: "Copie créée.",
      content: { "application/json": { schema: routineDetailSchema } },
    },
    401: unauthenticated,
    404: routineNotFound,
  },
});

const reorderRoute = createRoute({
  method: "post",
  path: "/v1/routines/reorder",
  tags: ["Routines"],
  summary: "Réordonner les routines",
  description:
    "La liste complète des identifiants dans leur nouvel ordre. Ce qui " +
    "n'appartient pas à l'appelant est ignoré plutôt que de faire échouer " +
    "tout le geste.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: reorderSchema } },
    },
  },
  responses: {
    200: {
      description: "Routines réordonnées.",
      content: { "application/json": { schema: routineListResponseSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

export const routinesRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

routinesRouter.use("/v1/routines", requireAuth);
routinesRouter.use("/v1/routines/*", requireAuth);

// `reorder` avant `{id}` : déclarée après, elle serait avalée par la route de
// duplication, qui accepte n'importe quel identifiant.
routinesRouter.openapi(reorderRoute, async (c) => {
  const routines = await reorderRoutines(c.req.valid("json"), c.get("user").id);

  return c.json({ data: routines }, 200);
});

routinesRouter.openapi(listRoute, async (c) => {
  // L'utilisateur vient de la session, jamais de la requête (doc 02).
  return c.json({ data: await listRoutines(c.req.valid("query"), c.get("user").id) }, 200);
});

routinesRouter.openapi(postRoute, async (c) => {
  const { locale } = c.req.valid("query");

  return c.json(await createRoutine(c.req.valid("json"), c.get("user").id, locale), 201);
});

routinesRouter.openapi(duplicateRoute, async (c) => {
  const { locale } = c.req.valid("query");

  return c.json(await duplicateRoutine(c.req.valid("param").id, c.get("user").id, locale), 201);
});

routinesRouter.openapi(putRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  return c.json(await replaceRoutine(id, c.req.valid("json"), c.get("user").id, locale), 200);
});

routinesRouter.openapi(patchRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  return c.json(await updateRoutineMeta(id, c.req.valid("json"), c.get("user").id, locale), 200);
});

routinesRouter.openapi(deleteRoute, async (c) => {
  await deleteRoutine(c.req.valid("param").id, c.get("user").id);

  return c.body(null, 204);
});

routinesRouter.openapi(detailRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { locale } = c.req.valid("query");

  const routine = await getRoutine(id, c.get("user").id, locale);

  if (!routine) {
    throw notFound("Routine");
  }

  return c.json(routine, 200);
});
