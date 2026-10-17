import type { MockSet } from "./routines";

/** Une exécution d'un exercice dans une séance. */
export type Performance = { date: string; sessionId: string; sets: MockSet[] };
type Dated = { value: number; date: string };

/** 1RM estimé, formule d'Epley ; une seule répétition vaut la charge elle-même. */
export function estimate1rm(kg: number, reps: number): number {
  return reps <= 1 ? kg : kg * (1 + reps / 30);
}

// Une charge non notée (`null`) compte pour 0 : elle ne bat aucun record.
export const sessionVolume = (p: Performance) =>
  p.sets.reduce((s, set) => s + (set.kg ?? 0) * set.reps, 0);
export const best1rmOf = (p: Performance) =>
  Math.max(0, ...p.sets.map((s) => estimate1rm(s.kg ?? 0, s.reps)));
export const heaviestOf = (p: Performance) => Math.max(0, ...p.sets.map((s) => s.kg ?? 0));

function bestBy(history: Performance[], measure: (p: Performance) => number): Dated {
  return history.reduce<Dated>(
    (best, p) => {
      const value = measure(p);
      return value > best.value ? { value, date: p.date } : best;
    },
    { value: 0, date: "" },
  );
}

export function records(history: Performance[]) {
  return {
    heaviest: bestBy(history, heaviestOf),
    best1rm: bestBy(history, best1rmOf),
    bestVolume: bestBy(history, sessionVolume),
  };
}

/** La plus lourde charge faite pour chaque nombre de répétitions. */
export function bestByReps(history: Performance[]): Map<number, number> {
  const best = new Map<number, number>();
  for (const p of history)
    for (const s of p.sets) best.set(s.reps, Math.max(best.get(s.reps) ?? 0, s.kg ?? 0));
  return best;
}

/** Charges de 100 % à 50 % du 1RM, par paliers de 5, arrondies aux 2,5 kg (disques de 1,25 kg). */
export function oneRmPercentages(oneRm: number): { percent: number; kg: number }[] {
  return Array.from({ length: 11 }, (_, i) => {
    const percent = 100 - i * 5;
    return { percent, kg: Math.round((oneRm * percent) / 100 / 2.5) * 2.5 };
  });
}
