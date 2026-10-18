import { addDays, movingAverage } from "./stats";

type Weighing = { date: string; kg: number };

/** Écart entre la moyenne sur 7 jours de la dernière pesée et celle d'il y a `days` pesées. */
export function averageDelta(weights: Weighing[], days: number): number {
  const avg = movingAverage(
    weights.map((w) => w.kg),
    7,
  );
  const last = avg.at(-1);
  const before = avg.at(-1 - days);
  return last === undefined || before === undefined ? 0 : last - before;
}

/** Le 1RM estimé rapporté au poids de corps (D281), à deux décimales. */
export function relativeStrength(oneRm: number, bodyweight: number): number {
  return bodyweight > 0 ? Math.round((oneRm / bodyweight) * 100) / 100 : 0;
}

/** Le poids à une date : la moyenne des sept dernières pesées jusqu'à elle. */
export function weightAt(weights: readonly Weighing[], date: string): number | null {
  const upTo = weights.filter((w) => w.date <= date).slice(-7);
  return upTo.length ? upTo.reduce((n, w) => n + w.kg, 0) / upTo.length : null;
}

export const WEIGHT_GOAL = 78;

/**
 * Quand l'objectif sera atteint au rythme actuel (D268) : `perWeek` est la pente de la moyenne,
 * en kg par semaine. Rien si l'on s'en éloigne, si l'on stagne, ou s'il est déjà atteint.
 */
export function goalEta(
  current: number,
  goal: number,
  perWeek: number,
  today: string,
): string | null {
  const gap = goal - current;
  if (Math.abs(gap) < 0.05 || perWeek === 0 || Math.sign(gap) !== Math.sign(perWeek)) return null;
  return addDays(today, Math.round((gap / perWeek) * 7));
}
