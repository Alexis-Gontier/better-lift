import { type MockExercise, mockExercises } from "./exercises";
import { signal } from "./signal";

/**
 * Les exercices modifiables du wireframe : la note épinglée de tout exercice, et les exercices
 * personnalisés (D240). Le tableau du catalogue est mis à jour EN PLACE : `exerciseBySlug`,
 * lu partout (routines, séances, fil d'Ariane), voit ainsi un exercice créé ou renommé.
 */
const version = signal(0);

/** Les exercices, relus à chaque enregistrement. */
export function useExercises(): MockExercise[] {
  version.use();
  return mockExercises;
}

/** Remplace l'exercice de même slug, ou l'ajoute s'il est nouveau. */
export function saveExercise(exercise: MockExercise) {
  const i = mockExercises.findIndex((e) => e.slug === exercise.slug);
  if (i === -1) mockExercises.push(exercise);
  else mockExercises[i] = exercise;
  version.set(version.get() + 1);
}

/** Sans casse ni accents ni ponctuation : « Presse à cuisses » → « presse-a-cuisses ». */
function kebab(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Le slug d'un exercice personnalisé, préfixé pour ne jamais heurter le catalogue. */
export function customSlug(name: string, taken: readonly string[]): string {
  const base = `perso-${kebab(name) || "exercice"}`;
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Le nom de l'exercice en cours de création : la ligne brouillon de la liste le suit (D238). */
const draftName = signal("");
export const setExerciseDraftName = draftName.set;
export const useExerciseDraftName = draftName.use;
