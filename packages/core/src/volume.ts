import { roundKg, toNumberOrZero } from "./decimal.js";
import {
  type ExerciseType,
  type MeasuredExercise,
  type MeasuredSet,
  type MeasuredWorkout,
} from "./types.js";

/**
 * Types d'exercices qui contribuent au volume (invariant 1, doc 03).
 *
 * Sont exclus :
 * - le poids de corps, qui n'est pas une charge soulevée mesurable (D12) ;
 * - l'assistance, qui *soustrait* de la charge au lieu d'en ajouter ;
 * - la durée et la distance, qui ne sont pas homogènes à un volume en kg.
 */
const VOLUME_BEARING_TYPES: ReadonlySet<ExerciseType> = new Set<ExerciseType>([
  "WEIGHT_REPS",
  "WEIGHTED_BODYWEIGHT",
]);

export function contributesToVolume(exerciseType: ExerciseType): boolean {
  return VOLUME_BEARING_TYPES.has(exerciseType);
}

/**
 * Une série ne compte que si elle a été validée et n'est pas un échauffement
 * (invariants 1 et 5). Une série planifiée non validée reste affichée mais
 * n'entre ni dans les agrégats ni dans les records.
 */
export function countsTowardTotals(set: MeasuredSet): boolean {
  return set.completed && set.type !== "WARMUP";
}

/** Volume d'une série, en kg : `reps × charge`, ou 0 si elle ne compte pas. */
export function setVolume(set: MeasuredSet, exerciseType: ExerciseType): number {
  if (!countsTowardTotals(set) || !contributesToVolume(exerciseType)) {
    return 0;
  }

  const reps = set.reps ?? 0;
  const weightKg = toNumberOrZero(set.weightKg);

  if (reps <= 0 || weightKg <= 0) {
    return 0;
  }

  return roundKg(reps * weightKg);
}

export function exerciseVolume(exercise: MeasuredExercise): number {
  const total = exercise.sets.reduce((sum, set) => sum + setVolume(set, exercise.exerciseType), 0);

  return roundKg(total);
}

export function workoutVolume(workout: MeasuredWorkout): number {
  const total = workout.exercises.reduce((sum, exercise) => sum + exerciseVolume(exercise), 0);

  return roundKg(total);
}

/** Agrégats dénormalisés sur `Workout`, recalculés à l'écriture (doc 03, §3). */
export interface WorkoutTotals {
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
}

export function workoutTotals(workout: MeasuredWorkout): WorkoutTotals {
  let totalSets = 0;
  let totalReps = 0;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (!countsTowardTotals(set)) {
        continue;
      }

      totalSets += 1;
      totalReps += set.reps ?? 0;
    }
  }

  return {
    totalVolumeKg: workoutVolume(workout),
    totalSets,
    totalReps,
  };
}

/** Durée d'une séance, bornée à 24 h pour absorber les séances oubliées ouvertes (invariant 2). */
export const MAX_WORKOUT_DURATION_SEC = 24 * 60 * 60;

export function workoutDurationSec(startedAt: Date, endedAt: Date | null | undefined): number {
  if (!endedAt) {
    return 0;
  }

  const elapsed = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

  if (elapsed <= 0) {
    return 0;
  }

  return Math.min(elapsed, MAX_WORKOUT_DURATION_SEC);
}
