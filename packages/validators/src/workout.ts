import { z } from "zod";

import { exerciseSummarySchema } from "./exercise.js";
import { paginatedSchema, paginationQuerySchema } from "./pagination.js";
import {
  distanceMSchema,
  MAX_SETS_PER_EXERCISE,
  rpeSchema,
  setTypeSchema,
  weightKgSchema,
} from "./routine.js";
import { visibilitySchema } from "./session.js";

/**
 * Contrats des séances (doc 04, § Séances).
 *
 * Une séance est un **instantané indépendant** : elle porte des valeurs
 * réalisées, copiées de la routine au démarrage, et ne référence aucune de ses
 * lignes (règle non négociable n°5). D'où la symétrie presque parfaite avec les
 * contrats de routine, à un préfixe près — `targetReps` devient `reps`.
 */

export const recordTypeSchema = z.enum([
  "BEST_1RM",
  "BEST_WEIGHT",
  "BEST_SET_VOLUME",
  "BEST_REPS",
  "BEST_DURATION",
  "BEST_DISTANCE",
]);

/** 24 h, le plafond de durée d'une séance (invariant 2, doc 03). */
const MAX_DURATION_SEC = 86_400;

export const MAX_EXERCISES_PER_WORKOUT = 50;

/**
 * Série **réalisée**.
 *
 * `completed = false` signifie planifiée mais non validée : la série est
 * conservée pour l'affichage — l'utilisateur voit ce qu'il n'a pas fait — mais
 * exclue des agrégats et des records (doc 03).
 *
 * `completedAt` est fourni par le client parce que lui seul le sait : entre la
 * coche en salle et l'envoi de la séance, il peut s'écouler une heure de
 * vestiaire, ou trois jours de panne réseau.
 */
export const workoutSetInputSchema = z.object({
  type: setTypeSchema.default("NORMAL"),
  reps: z.number().int().min(0).max(999).nullable().optional(),
  weightKg: weightKgSchema.nullable().optional(),
  durationSec: z.number().int().min(0).max(MAX_DURATION_SEC).nullable().optional(),
  distanceM: distanceMSchema.nullable().optional(),
  rpe: rpeSchema.nullable().optional(),
  completed: z.boolean().default(false),
  completedAt: z.iso.datetime().nullable().optional(),
});

export const workoutExerciseInputSchema = z.object({
  exerciseId: z.string().min(1),
  notes: z.string().trim().max(500).nullable().optional(),
  restSec: z.number().int().min(10).max(3600).nullable().optional(),
  supersetGroup: z.number().int().min(0).max(50).nullable().optional(),
  /**
   * Zéro série est accepté, contrairement à une routine.
   *
   * Le cas se produit tout seul : on ajoute un exercice en fin de séance, on
   * s'aperçoit qu'on n'a plus le temps, on enregistre. Refuser le corps entier
   * ferait perdre la séance pour une ligne vide — le pire résultat possible
   * pour un outil de terrain.
   */
  sets: z.array(workoutSetInputSchema).max(MAX_SETS_PER_EXERCISE).default([]),
});

/**
 * Corps commun au `POST` et au `PUT`, l'identifiant mis à part.
 *
 * **Non `strict()`**, contrairement aux routines : la règle générale de l'API
 * est de tolérer les champs inconnus en entrée parce que les vieux clients
 * mobiles restent en circulation des mois (doc 04). Nulle part ce n'est plus
 * vrai qu'ici — c'est le seul corps qu'un client envoie depuis une file de
 * synchronisation, parfois plusieurs jours après la séance. Perdre une séance
 * réelle sur un champ ajouté depuis serait un incident grave ; un champ ignoré
 * ne l'est pas.
 */
const workoutFields = {
  /** Nulle si séance libre. La routine n'est qu'une origine, jamais un lien vivant. */
  routineId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1, "Le titre est requis.").max(120, "120 caractères au maximum."),
  notes: z.string().trim().max(2000).nullable().optional(),
  startedAt: z.iso.datetime(),
  /**
   * Nulle pour une séance encore en cours. L'API l'accepte, mais le mobile ne
   * l'envoie qu'à la fin : tant que la séance vit, elle reste un brouillon
   * local (doc 06), et le réseau n'intervient pas.
   */
  endedAt: z.iso.datetime().nullable().optional(),
  /** Absente, la visibilité par défaut du profil s'applique. */
  visibility: visibilitySchema.optional(),
  exercises: z.array(workoutExerciseInputSchema).max(MAX_EXERCISES_PER_WORKOUT).default([]),
};

/** La fin ne peut pas précéder le début — une durée négative fausserait tout. */
function chronological(value: { startedAt: string; endedAt?: string | null }): boolean {
  return !value.endedAt || Date.parse(value.endedAt) >= Date.parse(value.startedAt);
}

function chronologyError() {
  return { message: "La fin d'une séance ne peut pas précéder son début.", path: ["endedAt"] };
}

export const workoutStructureSchema = z
  .object(workoutFields)
  .refine(chronological, chronologyError());

/**
 * Création. **L'identifiant est généré par le client** (règle non négociable
 * n°7) : c'est ce qui rend le `POST` idempotent. Un `id` déjà connu renvoie la
 * séance existante, jamais un doublon — le bug numéro un des trackers de sport
 * est la séance enregistrée deux fois par une reconnexion au mauvais moment.
 */
export const createWorkoutSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(8, "Identifiant trop court.")
      .max(64, "64 caractères au maximum.")
      // Un identifiant est repris tel quel dans une URL et dans un cache
      // client : le borner à l'alphabet des cuid évite d'avoir à s'en méfier.
      .regex(/^[A-Za-z0-9_-]+$/, "Caractères autorisés : lettres, chiffres, tiret et tiret bas."),
    ...workoutFields,
  })
  .refine(chronological, chronologyError());

// ── Sorties ───────────────────────────────────────────────────────────────

export const workoutSetSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  type: setTypeSchema,
  reps: z.number().int().nullable(),
  weightKg: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  distanceM: z.string().nullable(),
  rpe: z.string().nullable(),
  completed: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
  /**
   * Purement informatif : la vérité des records reste `PersonalRecord`. Ce
   * drapeau n'existe que pour afficher un trophée sur la bonne ligne sans
   * recouper les deux tables à chaque rendu.
   */
  isPr: z.boolean(),
});

export const workoutExerciseSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  notes: z.string().nullable(),
  restSec: z.number().int().nullable(),
  supersetGroup: z.number().int().nullable(),
  exercise: exerciseSummarySchema,
  sets: z.array(workoutSetSchema),
});

export const workoutSummarySchema = z.object({
  id: z.string(),
  routineId: z.string().nullable(),
  title: z.string(),
  notes: z.string().nullable(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
  /** Agrégats **dénormalisés**, calculés à l'écriture (doc 03, §3). */
  durationSec: z.number().int(),
  totalVolumeKg: z.string(),
  totalSets: z.number().int(),
  totalReps: z.number().int(),
  prCount: z.number().int(),
  visibility: visibilitySchema,
  /** De quoi afficher une carte d'historique sans charger la structure. */
  exerciseCount: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workoutDetailSchema = workoutSummarySchema.extend({
  exercises: z.array(workoutExerciseSchema),
});

/**
 * Record battu pendant l'enregistrement. `previousValue` est nulle au premier
 * record sur cet exercice — l'interface dit alors « premier record » plutôt
 * qu'une progression depuis rien.
 */
export const newRecordSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  type: recordTypeSchema,
  value: z.string(),
  previousValue: z.string().nullable(),
});

/**
 * Réponse d'écriture : la séance persistée **et** ce qu'elle a fait tomber.
 *
 * Les records sont détectés serveur, jamais client (règle non négociable n°6) :
 * c'est la seule façon qu'un téléphone et un navigateur s'accordent sur ce qui
 * est un record.
 */
export const workoutSaveResponseSchema = workoutDetailSchema.extend({
  newRecords: z.array(newRecordSchema),
});

export const workoutListQuerySchema = paginationQuerySchema.extend({
  /** Bornes sur `startedAt`, incluses. */
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  routineId: z.string().min(1).optional(),
});

export const workoutListResponseSchema = paginatedSchema(workoutSummarySchema);

// ── Dernière performance ──────────────────────────────────────────────────

/**
 * Alimente la colonne « PRÉC. » de l'écran de saisie (doc 06) : les valeurs de
 * la dernière séance sur cet exercice, qui pré-remplissent les champs. Dans le
 * cas nominal, l'utilisateur ne tape rien — il coche.
 */
export const lastPerformanceSetSchema = z.object({
  position: z.number().int(),
  type: setTypeSchema,
  reps: z.number().int().nullable(),
  weightKg: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  distanceM: z.string().nullable(),
  rpe: z.string().nullable(),
});

export const lastPerformanceSchema = z.object({
  exerciseId: z.string(),
  workoutId: z.string(),
  performedAt: z.iso.datetime(),
  sets: z.array(lastPerformanceSetSchema),
});

export const MAX_LAST_PERFORMANCE_IDS = 50;

export const lastPerformanceQuerySchema = z.object({
  /**
   * Liste séparée par des virgules plutôt qu'un paramètre répété : l'écran de
   * saisie l'appelle une fois au démarrage, avec tous les exercices de la
   * routine d'un coup. Une requête par exercice ferait dix allers-retours au
   * moment précis où l'utilisateur attend devant sa barre.
   */
  exerciseIds: z
    .string()
    .transform((value) => value.split(",").map((id) => id.trim()))
    .pipe(z.array(z.string().min(1)).min(1).max(MAX_LAST_PERFORMANCE_IDS)),
});

/**
 * Un exercice jamais fait est **absent** de la réponse plutôt que présent avec
 * des valeurs nulles : le client teste la présence, et n'a pas à distinguer
 * « jamais fait » de « fait sans rien saisir ».
 */
export const lastPerformanceResponseSchema = z.object({ data: z.array(lastPerformanceSchema) });

export type RecordType = z.infer<typeof recordTypeSchema>;
export type WorkoutSetInput = z.input<typeof workoutSetInputSchema>;
export type WorkoutExerciseInput = z.input<typeof workoutExerciseInputSchema>;
export type WorkoutStructureInput = z.input<typeof workoutStructureSchema>;
export type WorkoutStructurePayload = z.infer<typeof workoutStructureSchema>;
export type CreateWorkoutInput = z.input<typeof createWorkoutSchema>;
export type CreateWorkoutPayload = z.infer<typeof createWorkoutSchema>;
export type WorkoutSet = z.infer<typeof workoutSetSchema>;
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;
export type WorkoutSummary = z.infer<typeof workoutSummarySchema>;
export type WorkoutDetail = z.infer<typeof workoutDetailSchema>;
export type NewRecord = z.infer<typeof newRecordSchema>;
export type WorkoutSaveResponse = z.infer<typeof workoutSaveResponseSchema>;
export type WorkoutListQuery = z.infer<typeof workoutListQuerySchema>;
export type WorkoutListResponse = z.infer<typeof workoutListResponseSchema>;
export type LastPerformance = z.infer<typeof lastPerformanceSchema>;
export type LastPerformanceQuery = z.infer<typeof lastPerformanceQuerySchema>;
export type LastPerformanceResponse = z.infer<typeof lastPerformanceResponseSchema>;
