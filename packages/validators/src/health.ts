import { z } from "zod";

/**
 * Contrats de `GET /health` et `GET /v1/version` (doc 04, § Santé).
 *
 * L'API valide sa réponse contre ces schémas, le web et le mobile en dérivent
 * leur typage : la source de vérité est unique (doc 02).
 */
export const healthStatusSchema = z.enum(["ok", "degraded"]);

export const databaseStatusSchema = z.enum(["ok", "down"]);

export const healthResponseSchema = z.object({
  /** `degraded` dès qu'une dépendance est indisponible. */
  status: healthStatusSchema,
  version: z.string().min(1),
  db: databaseStatusSchema,
  /** Secondes depuis le démarrage du processus. */
  uptimeSec: z.number().int().nonnegative(),
});

/**
 * Versions des briques déployées. Dans un monorepo, le numéro de l'API ne dit
 * pas quelle logique métier tourne réellement : `core` le précise.
 */
export const versionResponseSchema = z.object({
  api: z.string().min(1),
  core: z.string().min(1),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type DatabaseStatus = z.infer<typeof databaseStatusSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type VersionResponse = z.infer<typeof versionResponseSchema>;
