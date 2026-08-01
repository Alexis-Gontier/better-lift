import { z } from "zod";

import { DEFAULT_LOCALE, localeSchema } from "./locale.js";
import { paginatedSchema, paginationQuerySchema } from "./pagination.js";

/**
 * Contrats du catalogue d'exercices (doc 04, § Exercices).
 *
 * Les énumérations reprennent celles du schéma Prisma. Elles sont redéclarées
 * ici plutôt qu'importées : `packages/validators` est consommé par le web et le
 * mobile, qui n'ont pas le droit de dépendre de `@better-lift/db` (règle non
 * négociable n°1). Un test de l'API vérifie qu'elles ne divergent pas.
 */

export const exerciseTypeSchema = z.enum([
  "WEIGHT_REPS",
  "BODYWEIGHT_REPS",
  "WEIGHTED_BODYWEIGHT",
  "ASSISTED_BODYWEIGHT",
  "REPS_ONLY",
  "DURATION",
  "DURATION_WEIGHT",
  "DISTANCE_DURATION",
]);

export const bodyPartSchema = z.enum([
  "CHEST",
  "BACK",
  "SHOULDERS",
  "UPPER_ARMS",
  "LOWER_ARMS",
  "UPPER_LEGS",
  "LOWER_LEGS",
  "WAIST",
  "CARDIO",
  "NECK",
]);

/**
 * Un paramètre répétable (`?bodyPart=CHEST&bodyPart=BACK`) arrive sous forme de
 * chaîne quand il n'est présent qu'une fois, de tableau au-delà. Sans cette
 * normalisation, filtrer sur une seule valeur échouerait la validation.
 */
function repeatable<T extends z.ZodTypeAny>(item: T) {
  return z.preprocess(
    (value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
    z.array(item).optional(),
  );
}

export const exerciseListQuerySchema = paginationQuerySchema.extend({
  /** Recherche sur le nom **dans la locale demandée**, insensible à la casse. */
  q: z.string().trim().min(1).max(100).optional(),
  bodyPart: repeatable(bodyPartSchema),
  /** Chaîne libre issue du dataset : "barbell", "dumbbell", "body weight"… */
  equipment: repeatable(z.string().trim().min(1).max(50)),
  type: repeatable(exerciseTypeSchema),
  locale: localeSchema.default(DEFAULT_LOCALE),
});

/**
 * Vue de liste. Les instructions en sont absentes volontairement : ce sont des
 * tableaux de plusieurs centaines d'octets par exercice, inutiles dans une
 * grille, et le catalogue en compte 1 324.
 */
export const exerciseSummarySchema = z.object({
  id: z.string().min(1),
  /** Nom dans la locale demandée, avec repli sur le nom de base du catalogue. */
  name: z.string().min(1),
  type: exerciseTypeSchema,
  bodyPart: bodyPartSchema,
  equipment: z.string(),
  target: z.string(),
  secondaryMuscles: z.array(z.string()),
  thumbnailUrl: z.string().nullable(),
  animationUrl: z.string().nullable(),
  /**
   * Mention de copyright à afficher **partout où le média apparaît** (D17).
   * Elle est stockée en base et transportée jusqu'au client précisément pour
   * que l'obligation ne puisse pas être oubliée dans une interface.
   */
  attribution: z.string().nullable(),
  isCustom: z.boolean(),
});

/** Fiche détaillée : le résumé, plus ce qui ne tient pas dans une grille. */
export const exerciseDetailSchema = exerciseSummarySchema.extend({
  instructions: z.array(z.string()),
  locale: localeSchema,
});

export const exerciseListResponseSchema = paginatedSchema(exerciseSummarySchema);

export const exerciseDetailQuerySchema = z.object({
  locale: localeSchema.default(DEFAULT_LOCALE),
});

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type BodyPart = z.infer<typeof bodyPartSchema>;
// `Locale` vient de `locale.js` : le réexporter ici rendrait le nom ambigu
// pour le `export *` de l'index, et TypeScript l'exclurait.
export type ExerciseListQuery = z.infer<typeof exerciseListQuerySchema>;
export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type ExerciseDetail = z.infer<typeof exerciseDetailSchema>;
export type ExerciseListResponse = z.infer<typeof exerciseListResponseSchema>;
