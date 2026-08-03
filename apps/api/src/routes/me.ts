// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { APIError } from "better-auth/api";

import {
  apiErrorSchema,
  currentUserSchema,
  dataExportSchema,
  deleteAccountSchema,
  updateMeSchema,
} from "@better-lift/validators";

import { type AppEnv, auth } from "../lib/auth.js";
import { ApiError } from "../lib/errors.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import {
  exportUserData,
  getCurrentUser,
  hasPassword,
  updateCurrentUser,
} from "../services/me.service.js";

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

const exportRoute = createRoute({
  method: "post",
  path: "/v1/me/export",
  tags: ["Compte"],
  summary: "Exporter ses données (RGPD)",
  description:
    "Renvoie **immédiatement** le document JSON complet, en pièce jointe " +
    "(`Content-Disposition`), plutôt que de l'envoyer par e-mail (D27) : à " +
    "l'échelle d'une pratique personnelle le fichier se construit en une " +
    "requête, et un export part alors vers une session authentifiée au lieu " +
    "d'une boîte mail.\n\n" +
    "Le document est autoportant — chaque exercice cité l'est par son " +
    "identifiant et son nom —, indépendant de la locale, et contient jusqu'aux " +
    "routines supprimées, dont la suppression n'est que logique.\n\n" +
    "`POST` et non `GET` bien qu'il ne modifie rien : il parcourt l'historique " +
    "entier, et rien ne doit pouvoir le mettre en cache ni le préchercher.",
  responses: {
    200: {
      description: "Export complet.",
      content: { "application/json": { schema: dataExportSchema } },
    },
    401: unauthenticated,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/v1/me",
  tags: ["Compte"],
  summary: "Supprimer son compte",
  description:
    "Suppression **immédiate et réelle** (D18) : séances, routines, dossiers, " +
    "records et exercices personnalisés partent avec le compte, dans une " +
    "transaction. Pas de drapeau, pas de délai de grâce ; les sauvegardes sont " +
    "purgées sous 30 jours.\n\n" +
    "Le mot de passe est **exigé dès que le compte en porte un**. Un compte " +
    "créé par GitHub seul n'en a aucun : il envoie un corps vide, et c'est " +
    "alors la fraîcheur de la session qui fait office de confirmation — une " +
    "session trop ancienne renvoie 401, il faut se reconnecter.\n\n" +
    "Le corps est requis même vide, pour distinguer « rien à confirmer » de " +
    "« champ oublié ».",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: deleteAccountSchema } },
    },
  },
  responses: {
    204: { description: "Compte supprimé." },
    401: {
      description: "Session absente, expirée, ou trop ancienne pour confirmer une suppression.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    422: {
      description: "Mot de passe manquant ou incorrect.",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

/**
 * Traduit une erreur de Better Auth vers le format unique de la doc 04.
 *
 * Better Auth lève une `APIError` avec ses propres statuts — un `400` que notre
 * contrat ne connaît pas —, et l'`errorHandler` la classerait en `INTERNAL` :
 * l'utilisateur verrait « erreur interne » pour un mot de passe mal saisi.
 */
function toApiError(error: unknown): Error {
  if (!(error instanceof APIError)) {
    // Rien à traduire : l'`errorHandler` la journalisera et répondra 500.
    return error instanceof Error ? error : new Error("Échec de la suppression du compte.");
  }

  const code = typeof error.body?.code === "string" ? error.body.code : "";

  if (code === "INVALID_PASSWORD" || code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
    return new ApiError("VALIDATION_FAILED", "Mot de passe incorrect.", [
      { path: "password", message: "Mot de passe incorrect." },
    ]);
  }

  // Session valide mais trop ancienne : Better Auth exige une session fraîche
  // quand aucun mot de passe ne vient la confirmer.
  if (code === "SESSION_EXPIRED") {
    return new ApiError(
      "UNAUTHENTICATED",
      "Reconnectez-vous pour confirmer la suppression de votre compte.",
    );
  }

  return error;
}

export const meRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

meRouter.use("/v1/me", requireAuth);
meRouter.use("/v1/me/*", requireAuth);

meRouter.openapi(getMeRoute, async (c) => {
  return c.json(await getCurrentUser(c.get("user").id), 200);
});

meRouter.openapi(patchMeRoute, async (c) => {
  return c.json(await updateCurrentUser(c.get("user").id, c.req.valid("json")), 200);
});

meRouter.openapi(exportRoute, async (c) => {
  const data = await exportUserData(c.get("user").id);

  // Le nom du fichier porte la date : deux exports ne s'écrasent pas dans le
  // dossier de téléchargement.
  const day = data.exportedAt.slice(0, 10);

  c.header("Content-Disposition", `attachment; filename="better-lift-export-${day}.json"`);

  return c.json(data, 200);
});

meRouter.openapi(deleteRoute, async (c) => {
  const userId = c.get("user").id;
  const { password } = c.req.valid("json");

  // Le service tranche, parce que lui seul sait si le compte porte un mot de
  // passe : le contrat, lui, ne peut pas rendre le champ conditionnel.
  if (!password && (await hasPassword(userId))) {
    throw new ApiError("VALIDATION_FAILED", "Le mot de passe est requis.", [
      { path: "password", message: "Le mot de passe est requis." },
    ]);
  }

  let headers: Headers;

  try {
    /**
     * La suppression passe par Better Auth, jamais par un `prisma.user.delete`
     * direct : lui seul vérifie le mot de passe, révoque les sessions et
     * déclenche `beforeDelete`, où vit la purge des données applicatives.
     */
    ({ headers } = await auth.api.deleteUser({
      body: password ? { password } : {},
      headers: c.req.raw.headers,
      returnHeaders: true,
    }));
  } catch (error) {
    throw toApiError(error);
  }

  // Better Auth périme le cookie de session dans **sa** réponse, que nous ne
  // renvoyons pas : sans ce report, le navigateur garderait un cookie pointant
  // vers un compte disparu, et chaque écran répondrait 401 au lieu de rendre la
  // main à l'écran de connexion.
  for (const cookie of headers.getSetCookie()) {
    c.header("set-cookie", cookie, { append: true });
  }

  return c.body(null, 204);
});
