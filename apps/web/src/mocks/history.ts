import { workouts } from "./generated-workouts";
import { type MockRoutineExercise, type MockSet, mockRoutines } from "./routines";
import type { MockSession } from "./sessions";
import { estimate1rm } from "./stats";
import type { RealSet } from "./workouts";

/** Une série faite ; `record` dit qu'elle a battu un record à ce moment-là. */
type DoneSet = MockSet & { record?: boolean };
type DoneExercise = Omit<MockRoutineExercise, "sets"> & { sets: DoneSet[] };
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

const oneRm = ([kg, reps]: RealSet) => (kg === null ? 0 : estimate1rm(kg, reps));

/**
 * Les records, dérivés à la lecture : dans chaque séance, la meilleure série d'un exercice
 * (1RM estimé) est un record si elle bat tout ce qui a été fait AVANT cette séance. La
 * première fois ne compte pas : il n'y a rien à battre. Clé : `séance|slug` → index de série.
 */
const recordSets: Map<string, number> = (() => {
  const best = new Map<string, number>();
  const out = new Map<string, number>();
  for (const w of [...workouts].reverse()) {
    for (const e of w.exercises) {
      const values = e.sets.map(oneRm);
      const top = Math.max(...values);
      const previous = best.get(e.slug);
      if (previous !== undefined && top > previous)
        out.set(`${w.id}|${e.slug}`, values.indexOf(top));
      best.set(e.slug, Math.max(previous ?? 0, top));
    }
  }
  return out;
})();

/** Le repos de l'exercice dans ses routines ; 90 s s'il n'y figure pas. */
const restOf = (slug: string) =>
  mockRoutines.flatMap((r) => r.exercises).find((e) => e.slug === slug)?.restSeconds ?? 90;

/** Les séries réellement faites, avec leurs records. */
export function sessionDetail(session: MockSession): SessionDetail {
  const workout = workouts.find((w) => w.id === session.id);
  const exercises = (workout?.exercises ?? []).map((e) => {
    const record = recordSets.get(`${session.id}|${e.slug}`);
    return {
      slug: e.slug,
      restSeconds: restOf(e.slug),
      sets: e.sets.map(([kg, reps], i) => ({ kg, reps, ...(i === record && { record: true }) })),
    };
  });
  return { session, exercises };
}

export const doneVolume = (d: SessionDetail) =>
  d.exercises.reduce((sum, e) => sum + e.sets.reduce((s, x) => s + (x.kg ?? 0) * x.reps, 0), 0);

export const doneRecords = (d: SessionDetail) =>
  d.exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.record).length, 0);
