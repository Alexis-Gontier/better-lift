// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import {
  apiErrorSchema,
  DEFAULT_LOCALE,
  localeSchema,
  statsMuscleDistributionQuerySchema,
  statsMuscleDistributionResponseSchema,
  statsRecordsQuerySchema,
  statsRecordsResponseSchema,
  statsStreakQuerySchema,
  statsStreakResponseSchema,
  statsSummaryQuerySchema,
  statsSummarySchema,
  statsVolumeQuerySchema,
  statsVolumeResponseSchema,
} from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getMuscleDistribution,
  getRecentRecords,
  getStreak,
  getSummary,
  getVolume,
} from "../services/stat.service.js";

const unauthenticated = {
  description: "Session absente ou expirée.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const invalidQuery = {
  description: "Paramètres de requête invalides.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const TAGS = ["Statistiques"];

/**
 * Toutes ces routes découpent le temps dans le **fuseau du profil**, jamais en
 * UTC : une séance du samedi soir à Paris est déjà dimanche en UTC pendant
 * l'heure d'été.
 */
const summaryRoute = createRoute({
  method: "get",
  path: "/v1/stats/summary",
  tags: TAGS,
  summary: "Chiffres clés du tableau de bord",
  description:
    "Un seul appel sert les quatre cartes. `previousPeriod` porte la période " +
    "précédente de même durée, pour afficher les variations sans second appel — " +
    "il vaut `null` pour `range=all`, où il n'existe rien avant l'inscription.",
  request: { query: statsSummaryQuerySchema },
  responses: {
    200: {
      description: "Chiffres de la période.",
      content: { "application/json": { schema: statsSummarySchema } },
    },
    401: unauthenticated,
    422: invalidQuery,
  },
});

const volumeRoute = createRoute({
  method: "get",
  path: "/v1/stats/volume",
  tags: TAGS,
  summary: "Volume par semaine ou par mois",
  description:
    "Sans bornes, rend les douze dernières périodes. Les périodes **sans " +
    "séance sont présentes avec des zéros** : un graphique qui les saute ment " +
    "sur le rythme, et c'est justement la coupure involontaire qu'on cherche à voir.",
  request: { query: statsVolumeQuerySchema },
  responses: {
    200: {
      description: "Série temporelle, une entrée par période.",
      content: { "application/json": { schema: statsVolumeResponseSchema } },
    },
    401: unauthenticated,
    422: invalidQuery,
  },
});

const muscleDistributionRoute = createRoute({
  method: "get",
  path: "/v1/stats/muscle-distribution",
  tags: TAGS,
  summary: "Répartition des séries par partie du corps",
  description:
    "Trié par nombre de séries décroissant, les parties à zéro omises. Les " +
    "séries d'échauffement et non validées sont exclues, comme partout ailleurs.",
  request: { query: statsMuscleDistributionQuerySchema },
  responses: {
    200: {
      description: "Répartition de la période.",
      content: { "application/json": { schema: statsMuscleDistributionResponseSchema } },
    },
    401: unauthenticated,
    422: invalidQuery,
  },
});

const streakRoute = createRoute({
  method: "get",
  path: "/v1/stats/streak",
  tags: TAGS,
  summary: "Régularité",
  description:
    "`days` porte une entrée par jour de la fenêtre, jours vides compris, pour " +
    "une heatmap. La fenêtre commence toujours un lundi, sinon les colonnes ne " +
    "s'alignent pas. `longestWeeks` se mesure sur tout l'historique, pas sur la " +
    "seule fenêtre affichée.",
  request: { query: statsStreakQuerySchema },
  responses: {
    200: {
      description: "Série en cours, record, et détail par jour.",
      content: { "application/json": { schema: statsStreakResponseSchema } },
    },
    401: unauthenticated,
    422: invalidQuery,
  },
});

const recordsRoute = createRoute({
  method: "get",
  path: "/v1/stats/records",
  tags: TAGS,
  summary: "Records les plus récents",
  description:
    "Le nom de l'exercice est rendu dans la locale demandée, avec repli sur " +
    "l'anglais. `workoutId` est nul si la séance d'origine a été supprimée : le " +
    "record reste vrai, on perd seulement le lien vers la série qui l'a produit.",
  request: {
    query: statsRecordsQuerySchema.extend({ locale: localeSchema.default(DEFAULT_LOCALE) }),
  },
  responses: {
    200: {
      description: "Records, du plus récent au plus ancien.",
      content: { "application/json": { schema: statsRecordsResponseSchema } },
    },
    401: unauthenticated,
    422: invalidQuery,
  },
});

export const statsRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

/**
 * Le préfixe entier est protégé d'un coup : une route de statistiques ajoutée
 * plus tard sans son `use` serait ouverte, et rien ne le signalerait.
 */
statsRouter.use("/v1/stats/*", requireAuth);

statsRouter.openapi(summaryRoute, async (c) => {
  return c.json(await getSummary(c.req.valid("query"), c.get("user").id), 200);
});

statsRouter.openapi(volumeRoute, async (c) => {
  return c.json(await getVolume(c.req.valid("query"), c.get("user").id), 200);
});

statsRouter.openapi(muscleDistributionRoute, async (c) => {
  return c.json(await getMuscleDistribution(c.req.valid("query"), c.get("user").id), 200);
});

statsRouter.openapi(streakRoute, async (c) => {
  return c.json(await getStreak(c.req.valid("query"), c.get("user").id), 200);
});

statsRouter.openapi(recordsRoute, async (c) => {
  const { locale, ...query } = c.req.valid("query");

  return c.json(await getRecentRecords(query, c.get("user").id, locale), 200);
});
