import { type MockRoutine, mockRoutines } from "./routines";
import { signal } from "./signal";

/**
 * Les routines modifiables du wireframe, en mémoire jusqu'au rechargement. Sans API, c'est ici
 * qu'un enregistrement atterrit : la liste, le détail et le fil d'Ariane le voient aussitôt.
 * Remplacé au branchement par TanStack Query.
 */
const routines = signal<MockRoutine[]>(mockRoutines);

export const useRoutines = routines.use;

export function useRoutine(id: string): MockRoutine | undefined {
  return useRoutines().find((r) => r.id === id);
}

/** Remplace la routine de même identifiant, ou l'ajoute en tête si elle est nouvelle. */
export function saveRoutine(routine: MockRoutine) {
  const all = routines.get();
  const known = all.some((r) => r.id === routine.id);
  routines.set(known ? all.map((r) => (r.id === routine.id ? routine : r)) : [routine, ...all]);
}

export function deleteRoutine(id: string) {
  routines.set(routines.get().filter((r) => r.id !== id));
}

/** Un identifiant qui ne heurte ni les routines de prod (« 1 », « 2 »…) ni les autres créées. */
export function newRoutineId(): string {
  return `new-${Date.now().toString(36)}`;
}

/** Le nom de la routine en cours de création : la ligne brouillon de la liste le suit (D238). */
const draftName = signal("");
export const setDraftName = draftName.set;
export const useDraftName = draftName.use;
