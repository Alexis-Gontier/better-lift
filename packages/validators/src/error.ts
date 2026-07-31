import { z } from "zod";

/**
 * Codes d'erreur de l'API (doc 04, § Format d'erreur). Stables et exploitables
 * par les clients : ne jamais en changer la valeur, seulement en ajouter.
 */
export const apiErrorCodeSchema = z.enum([
  "UNAUTHENTICATED", // 401 — session absente ou expirée
  "FORBIDDEN", // 403 — réservé aux cas sans enjeu de confidentialité
  "NOT_FOUND", // 404 — inexistante, ou appartenant à autrui (doc 04)
  "CONFLICT", // 409 — contrainte d'unicité
  "VALIDATION_FAILED", // 422 — payload invalide
  "RATE_LIMITED", // 429
  "INTERNAL", // 500 — loguée avec un requestId renvoyé au client
]);

/**
 * Forme unique des réponses non 2xx : les clients n'écrivent qu'un seul chemin
 * de traitement d'erreur.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    /** Message destiné aux développeurs, pas à l'utilisateur final. */
    message: z.string().min(1),
    /** Détail par champ, renseigné sur les erreurs de validation. */
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    /** Corrélation avec les logs serveur, renseigné sur les erreurs 500. */
    requestId: z.string().optional(),
  }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

/** Code HTTP associé à chaque code d'erreur (doc 04). */
export const API_ERROR_STATUS: Record<ApiErrorCode, 401 | 403 | 404 | 409 | 422 | 429 | 500> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};
