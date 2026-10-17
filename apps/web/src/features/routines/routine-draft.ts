import { FOLDERS, type MockRoutine, type MockRoutineExercise } from "@/mocks/routines";

/** Un exercice du brouillon porte un identifiant stable : le glisser-déposer en a besoin. */
export type DraftExercise = MockRoutineExercise & { uid: string };
export type Draft = { name: string; folder: string; notes: string; exercises: DraftExercise[] };

export const emptyDraft: Draft = { name: "", folder: FOLDERS[0], notes: "", exercises: [] };

export function toDraft(routine: MockRoutine | undefined): Draft {
  if (!routine) return emptyDraft;
  return {
    name: routine.name,
    folder: routine.folder,
    notes: routine.notes ?? "",
    exercises: routine.exercises.map((e, i) => ({
      ...e,
      uid: `${e.slug}-${i}`,
      sets: e.sets.map((s) => ({ ...s })),
    })),
  };
}

/** La routine enregistrée à partir du brouillon ; ce qui n'est pas dans le brouillon est gardé. */
export function fromDraft(draft: Draft, base: Pick<MockRoutine, "id" | "lastDone">): MockRoutine {
  const notes = draft.notes.trim();
  return {
    ...base,
    name: draft.name.trim(),
    folder: draft.folder,
    ...(notes ? { notes } : {}),
    exercises: draft.exercises.map(({ uid: _uid, ...e }) => e),
  };
}

/** Le contenu du brouillon, sans les identifiants techniques : deux brouillons égaux s'y lisent pareil. */
function fingerprint(draft: Draft): string {
  return JSON.stringify({
    ...draft,
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    exercises: draft.exercises.map(({ uid: _uid, ...e }) => e),
  });
}

/** Le brouillon diffère-t-il de la routine enregistrée (ou d'une routine vide) ? */
export function isDirty(draft: Draft, routine: MockRoutine | undefined): boolean {
  return fingerprint(draft) !== fingerprint(toDraft(routine));
}

/** Enregistrable : un nom et au moins un exercice. */
export function canSave(draft: Draft): boolean {
  return draft.name.trim() !== "" && draft.exercises.length > 0;
}
