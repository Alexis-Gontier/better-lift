import { seeded } from "./random";
import { type MockRoutineExercise, type MockSet, mockRoutines } from "./routines";
import type { MockSession } from "./sessions";

/** Une série faite ; `record` dit qu'elle a battu un record à ce moment-là. */
type DoneSet = MockSet & { record?: boolean };
export type DoneExercise = Omit<MockRoutineExercise, "sets"> & { sets: DoneSet[] };
export type SessionDetail = { session: MockSession; exercises: DoneExercise[]; notes?: string };

/** Regroupe des séances déjà triées (la plus récente d'abord) par mois civil `YYYY-MM`. */
export function groupByMonth(sessions: MockSession[]) {
  const groups: { month: string; sessions: MockSession[] }[] = [];
  for (const s of sessions) {
    const month = s.date.slice(0, 7);
    const last = groups.at(-1);
    if (last?.month === month) last.sessions.push(s);
    else groups.push({ month, sessions: [s] });
  }
  return groups;
}

/** La séance précédente de la même routine (les séances sont triées, la plus récente d'abord). */
export function previousOf(sessions: MockSession[], id: string): MockSession | undefined {
  const i = sessions.findIndex((s) => s.id === id);
  const current = sessions[i];
  if (!current) return undefined;
  return sessions.slice(i + 1).find((s) => s.routine === current.routine);
}

/** Les séries faites, déduites de la routine avec un écart stable (graine = identifiant). */
export function sessionDetail(session: MockSession): SessionDetail {
  const routine = mockRoutines.find((r) => r.name === session.routine) ?? mockRoutines[0];
  const rand = seeded(Number(session.id) || 1);
  let recordsLeft = session.records;
  const exercises = (routine?.exercises ?? []).map((e) => {
    const sets: DoneSet[] = e.sets.map((set) => ({
      // Au poids du corps (0 kg), pas de charge ajoutée.
      kg: set.kg === 0 ? 0 : set.kg + (rand() < 0.3 ? 2.5 : 0),
      reps: Math.max(1, set.reps + (rand() < 0.25 ? -1 : 0)),
    }));
    const top = sets[0];
    if (recordsLeft > 0 && top) {
      top.record = true;
      recordsLeft -= 1;
    }
    return { ...e, sets };
  });
  return {
    session,
    exercises,
    notes: rand() < 0.3 ? "Bonne énergie, épaule gauche un peu raide." : undefined,
  };
}

export const doneVolume = (d: SessionDetail) =>
  d.exercises.reduce((sum, e) => sum + e.sets.reduce((s, x) => s + x.kg * x.reps, 0), 0);
