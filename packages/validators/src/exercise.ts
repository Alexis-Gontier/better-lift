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

/**
 * Normalise l'équipement **comme le seed** (`normalizeEquipment`) : minuscules,
 * espaces en tirets bas. Sans cela, un exercice personnalisé saisi « Body
 * Weight » serait invisible au filtre `?equipment=body_weight`, qui compare la
 * chaîne telle quelle — une panne silencieuse, l'exercice existant bel et bien.
 *
 * La règle vit ici, dans le contrat, plutôt que dans le service : c'est aussi
 * la forme que le client doit envoyer pour filtrer.
 */
export const equipmentValueSchema = z
  .string()
  .trim()
  .min(1, "L'équipement est requis.")
  .max(50, "50 caractères au maximum.")
  .transform((value) => value.toLowerCase().replace(/\s+/g, "_"));

export const exerciseListQuerySchema = paginationQuerySchema.extend({
  /** Recherche sur le nom **dans la locale demandée**, insensible à la casse. */
  q: z.string().trim().min(1).max(100).optional(),
  bodyPart: repeatable(bodyPartSchema),
  /** Chaîne libre issue du dataset : "barbell", "dumbbell", "body_weight"… */
  equipment: repeatable(equipmentValueSchema),
  type: repeatable(exerciseTypeSchema),
  /**
   * `true` : les seuls exercices personnalisés de l'utilisateur. `false` : le
   * seul catalogue commun. Absent : les deux, ce qui est le cas courant — on
   * cherche un exercice, pas une provenance.
   *
   * Une query string ne transporte que du texte : sans cette conversion,
   * `?custom=false` serait la chaîne `"false"`, donc vrai.
   */
  custom: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
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

/**
 * Création d'un exercice personnalisé (doc 04, § Exercices).
 *
 * Aucun média : le dataset est sous licence Gym visual (D17) et rien ne permet
 * d'en héberger pour un utilisateur. `thumbnailUrl`, `animationUrl` et
 * `attribution` restent donc nuls, et l'interface a déjà son repli.
 *
 * Aucune traduction non plus, au sens du dataset : l'utilisateur saisit **un**
 * nom, que le service écrit à l'identique dans chaque locale servie. Sans quoi
 * l'exercice disparaîtrait dès que le profil change de langue, la liste étant
 * enracinée sur `ExerciseTranslation`.
 */
/**
 * Les messages sont rédigés, et en français, comme sur le profil.
 *
 * Ce ne sont pas des libellés de débogage : ils sont affichés tels quels sous
 * le champ fautif par les formulaires web et mobile, qui valident avec **ce**
 * schéma avant d'appeler l'API. Les laisser au défaut de Zod donnerait un
 * « Too small: expected string to have >=1 characters » sous un formulaire par
 * ailleurs entièrement en français.
 */
const exerciseFields = {
  name: z.string().trim().min(1, "Le nom est requis.").max(100, "100 caractères au maximum."),
  type: exerciseTypeSchema,
  bodyPart: bodyPartSchema,
  equipment: equipmentValueSchema,
  /** Muscle cible principal : "pectorals", "lats"… */
  target: z
    .string()
    .trim()
    .min(1, "Le muscle cible est requis.")
    .max(50, "50 caractères au maximum.")
    .toLowerCase(),
  secondaryMuscles: z
    .array(z.string().trim().min(1).max(50).toLowerCase())
    .max(10, "10 muscles secondaires au maximum."),
  /** Étapes numérotées, comme celles du catalogue. */
  instructions: z
    .array(z.string().trim().min(1).max(500, "500 caractères par étape au maximum."))
    .max(20, "20 étapes au maximum."),
};

export const createExerciseSchema = z
  .object({
    ...exerciseFields,
    type: exerciseFields.type.default("WEIGHT_REPS"),
    secondaryMuscles: exerciseFields.secondaryMuscles.default([]),
    instructions: exerciseFields.instructions.default([]),
  })
  .strict();

/**
 * Modification partielle. `.strict()` pour la même raison que sur le profil :
 * sur une écriture, un champ mal orthographié serait ignoré en silence et
 * l'utilisateur croirait avoir enregistré.
 *
 * `bodyPart` et `type` restent modifiables : se tromper de catégorie à la
 * création est fréquent, et rien dans l'historique n'en dépend.
 *
 * Le schéma est reconstruit depuis les champs **sans leurs valeurs par
 * défaut**, et non dérivé de `createExerciseSchema.partial()` : un défaut
 * survit à `.partial()`, si bien qu'un corps vide se parserait en
 * `{ type: "WEIGHT_REPS", secondaryMuscles: [], instructions: [] }` — trois
 * clés, donc un `refine` satisfait, et un PATCH vide accepté qui écraserait
 * silencieusement le type et les instructions de l'exercice.
 */
export const updateExerciseSchema = z
  .object(exerciseFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni.",
  });

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
/**
 * Deux types par écriture, et la distinction compte :
 *
 * - `…Input` est ce qu'un **client envoie**. Les champs à valeur par défaut y
 *   sont facultatifs, et `equipment` y est du texte libre.
 * - `…Payload` est ce qu'un **service reçoit**, après validation : défauts
 *   appliqués, équipement normalisé. C'est la forme sur laquelle le service
 *   peut raisonner sans revérifier.
 */
export type CreateExerciseInput = z.input<typeof createExerciseSchema>;
export type CreateExercisePayload = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.input<typeof updateExerciseSchema>;
export type UpdateExercisePayload = z.infer<typeof updateExerciseSchema>;
export type BodyPart = z.infer<typeof bodyPartSchema>;
// `Locale` vient de `locale.js` : le réexporter ici rendrait le nom ambigu
// pour le `export *` de l'index, et TypeScript l'exclurait.
export type ExerciseListQuery = z.infer<typeof exerciseListQuerySchema>;
export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type ExerciseDetail = z.infer<typeof exerciseDetailSchema>;
export type ExerciseListResponse = z.infer<typeof exerciseListResponseSchema>;
