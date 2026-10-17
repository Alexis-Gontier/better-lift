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

type Linkable = { superset?: string };

/**
 * Les supersets d'une liste d'exercices, remis d'aplomb : un superset est une suite CONTIGUË
 * d'exercices de même lettre. Un exercice seul perd sa lettre ; les groupes sont renommés A, B…
 * dans l'ordre. À appliquer après tout changement de structure (lier, délier, glisser, retirer).
 */
export function normalizeSupersets<T extends Linkable>(exercises: readonly T[]): T[] {
  const runs: T[][] = [];
  for (const e of exercises) {
    const run = runs.at(-1);
    if (e.superset && run?.[0]?.superset === e.superset) run.push(e);
    else runs.push([e]);
  }
  let next = 0;
  return runs.flatMap((run) => {
    if (run.length < 2) return run.map(({ superset: _s, ...e }) => e as T);
    const letter = String.fromCharCode(65 + next++);
    return run.map((e) => ({ ...e, superset: letter }));
  });
}

/** Le dernier exercice (ou celui qui n'a pas de suivant) ne peut pas être lié. */
export function canLinkWithNext(exercises: readonly Linkable[], i: number): boolean {
  const e = exercises[i];
  const next = exercises[i + 1];
  return !!e && !!next && !(e.superset && e.superset === next.superset);
}

/** Lie l'exercice `i` au suivant : leurs groupes, s'ils en ont, fusionnent. */
export function linkWithNext<T extends Linkable>(exercises: readonly T[], i: number): T[] {
  if (!canLinkWithNext(exercises, i)) return [...exercises];
  const a = exercises[i]?.superset;
  const b = exercises[i + 1]?.superset;
  // Une lettre provisoire, qu'aucun groupe n'a : la normalisation la renomme.
  const letter = a ?? b ?? "~";
  const merged = exercises.map((e, j) => {
    const inA = a !== undefined && e.superset === a;
    const inB = b !== undefined && e.superset === b;
    return j === i || j === i + 1 || inA || inB ? { ...e, superset: letter } : e;
  });
  return normalizeSupersets(merged);
}

/** Sort l'exercice `i` de son superset ; le reste du groupe se recolle s'il reste contigu. */
export function unlink<T extends Linkable>(exercises: readonly T[], i: number): T[] {
  return normalizeSupersets(
    exercises.map((e, j) => {
      if (j !== i) return e;
      const { superset: _s, ...rest } = e;
      return rest as T;
    }),
  );
}

/** Le repos ne compte qu'après le dernier exercice d'un superset : les autres s'enchaînent. */
export function chainsIntoNext(exercises: readonly Linkable[], i: number): boolean {
  const e = exercises[i];
  return !!e?.superset && exercises[i + 1]?.superset === e.superset;
}
