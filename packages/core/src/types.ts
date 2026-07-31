/**
 * Types métier partagés.
 *
 * Ce package est volontairement autonome : il ne dépend ni de Prisma, ni de
 * React, ni d'une API de plateforme (règle non négociable n°9). Les
 * énumérations sont donc redéclarées ici en unions littérales, alignées sur
 * le schéma Prisma (doc 03) — la migration et ces types doivent bouger
 * ensemble.
 */

/** Détermine les champs saisissables pour une série (doc 03). */
export const EXERCISE_TYPES = [
  "WEIGHT_REPS",
  "BODYWEIGHT_REPS",
  "WEIGHTED_BODYWEIGHT",
  "ASSISTED_BODYWEIGHT",
  "REPS_ONLY",
  "DURATION",
  "DURATION_WEIGHT",
  "DISTANCE_DURATION",
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const SET_TYPES = ["WARMUP", "NORMAL", "FAILURE", "DROP"] as const;

export type SetType = (typeof SET_TYPES)[number];

export const RECORD_TYPES = [
  "BEST_1RM",
  "BEST_WEIGHT",
  "BEST_SET_VOLUME",
  "BEST_REPS",
  "BEST_DURATION",
  "BEST_DISTANCE",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

/**
 * Une charge traverse l'API sérialisée en chaîne (`"82.50"`) parce qu'elle est
 * stockée en `Decimal` (règle non négociable n°4). Les fonctions de ce package
 * acceptent les deux formes et normalisent elles-mêmes.
 */
export type DecimalLike = number | string;

/** Série réalisée, réduite aux champs qui pèsent sur les calculs. */
export interface MeasuredSet {
  type: SetType;
  completed: boolean;
  reps?: number | null;
  weightKg?: DecimalLike | null;
  durationSec?: number | null;
  distanceM?: DecimalLike | null;
}

/** Exercice d'une séance : son type conditionne la contribution au volume. */
export interface MeasuredExercise {
  exerciseType: ExerciseType;
  sets: readonly MeasuredSet[];
}

export interface MeasuredWorkout {
  exercises: readonly MeasuredExercise[];
}
