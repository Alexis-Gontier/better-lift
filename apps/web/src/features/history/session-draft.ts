import type { DoneExercise, SessionDetail } from "@/mocks/history";

/** Ce qu'on compare d'une séance corrigée (D239) : ses séries, sa note, sa durée. */
const setsKey = (e: DoneExercise) => JSON.stringify(e.sets.map(({ kg, reps }) => [kg, reps]));

/** Les exercices dont une série a changé, par position dans la séance. */
export function changedExercises(draft: SessionDetail, saved: SessionDetail): ReadonlySet<number> {
  const out = new Set<number>();
  draft.exercises.forEach((e, i) => {
    const was = saved.exercises[i];
    if (!was || setsKey(was) !== setsKey(e)) out.add(i);
  });
  return out;
}

/** Combien de choses la correction change (D261) : un exercice, la durée, la note. */
export function sessionChangeCount(draft: SessionDetail, saved: SessionDetail): number {
  return (
    changedExercises(draft, saved).size +
    Number(draft.session.minutes !== saved.session.minutes) +
    Number((draft.notes ?? "").trim() !== (saved.notes ?? "").trim())
  );
}
