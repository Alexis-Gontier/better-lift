import { type MockExercise, mockExercises } from "./exercises";
import { signal } from "./signal";

/**
 * Ce qui se modifie d'un exercice du wireframe : sa note épinglée (pas d'exercice personnel,
 * D286). Le tableau du catalogue est mis à jour EN PLACE : `exerciseBySlug`, lu partout
 * (routines, séances, fil d'Ariane), voit ainsi la note enregistrée.
 */
const version = signal(0);

/** Les exercices, relus à chaque enregistrement. */
export function useExercises(): MockExercise[] {
  version.use();
  return mockExercises;
}

/** Remplace l'exercice de même slug. */
export function saveExercise(exercise: MockExercise) {
  const i = mockExercises.findIndex((e) => e.slug === exercise.slug);
  if (i !== -1) mockExercises[i] = exercise;
  version.set(version.get() + 1);
}
