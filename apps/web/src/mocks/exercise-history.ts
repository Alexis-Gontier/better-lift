import type { Performance } from "./exercise-stats";
import { workouts } from "./generated-workouts";

/** Les exécutions d'un exercice, dans l'ordre chronologique (la plus ancienne d'abord). */
export function exerciseHistory(slug: string): Performance[] {
  return workouts
    .flatMap((w) =>
      w.exercises
        .filter((e) => e.slug === slug)
        .map((e) => ({
          date: w.date,
          sessionId: w.id,
          sets: e.sets.map(([kg, reps]) => ({ kg, reps })),
        })),
    )
    .reverse();
}
