import { useSyncExternalStore } from "react";
import { type MockRoutine, mockRoutines } from "./routines";

/**
 * Les routines modifiables du wireframe, en mémoire jusqu'au rechargement. Sans API, c'est ici
 * qu'un enregistrement atterrit : la liste, le détail et le fil d'Ariane le voient aussitôt.
 * Remplacé au branchement par TanStack Query.
 */
let routines: MockRoutine[] = mockRoutines;
const listeners = new Set<() => void>();

function commit(next: MockRoutine[]) {
  routines = next;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRoutines(): MockRoutine[] {
  return useSyncExternalStore(subscribe, () => routines);
}

export function useRoutine(id: string): MockRoutine | undefined {
  return useRoutines().find((r) => r.id === id);
}

/** Remplace la routine de même identifiant, ou l'ajoute en tête si elle est nouvelle. */
export function saveRoutine(routine: MockRoutine) {
  const known = routines.some((r) => r.id === routine.id);
  commit(known ? routines.map((r) => (r.id === routine.id ? routine : r)) : [routine, ...routines]);
}

export function deleteRoutine(id: string) {
  commit(routines.filter((r) => r.id !== id));
}

/** Un identifiant qui ne heurte ni les routines de prod (« 1 », « 2 »…) ni les autres créées. */
export function newRoutineId(): string {
  return `new-${Date.now().toString(36)}`;
}
