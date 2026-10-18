import { addDays, startOfWeek } from "./stats";

export const PERIODS = [
  { value: "4s", label: "4 sem.", days: 28 },
  { value: "3m", label: "3 mois", days: 91 },
  { value: "6m", label: "6 mois", days: 182 },
  { value: "1a", label: "1 an", days: 364 },
] as const;
export type Period = (typeof PERIODS)[number]["value"];

const daysOf = (period: Period) => PERIODS.find((p) => p.value === period)?.days ?? 91;

/** Le nombre de semaines de la période. */
export const weeksOf = (period: Period) => Math.round(daysOf(period) / 7);

/** Premier jour de la période (inclus). */
export function periodStart(period: Period, today: string): string {
  return addDays(today, -daysOf(period));
}

/** La période de même longueur juste avant : de quoi dire « mieux ou moins bien » (D267). */
export function previousRange(period: Period, today: string): { from: string; to: string } {
  const start = periodStart(period, today);
  return { from: addDays(start, -daysOf(period)), to: addDays(start, -1) };
}

export function inPeriod<T extends { date: string }>(
  items: T[],
  period: Period,
  today: string,
): T[] {
  const start = periodStart(period, today);
  return items.filter((i) => i.date >= start && i.date <= today);
}

type SessionFigures = { date: string; minutes: number; volume: number; records: number };

/** Les chiffres d'une période (D267) : séances et volume par semaine, durée moyenne, records. */
export function periodFigures(
  sessions: readonly SessionFigures[],
  from: string,
  to: string,
  weeks: number,
) {
  const these = sessions.filter((s) => s.date >= from && s.date <= to);
  const sum = (f: (s: SessionFigures) => number) => these.reduce((n, s) => n + f(s), 0);
  return {
    count: these.length,
    perWeek: Math.round((these.length / weeks) * 10) / 10,
    volumePerWeek: Math.round(sum((s) => s.volume) / weeks),
    avgMinutes: these.length ? Math.round(sum((s) => s.minutes) / these.length) : 0,
    records: sum((s) => s.records),
  };
}

type SetsLike = { exercises: { muscle: string; sets: number }[] };

/**
 * Les séries de travail par semaine et par muscle principal, le plus travaillé d'abord : la
 * mesure d'usage pour doser un muscle (repère courant : 10 à 20 par semaine).
 */
export function setsPerMuscle(details: readonly SetsLike[], weeks: number) {
  const byMuscle = new Map<string, number>();
  for (const d of details)
    for (const e of d.exercises) byMuscle.set(e.muscle, (byMuscle.get(e.muscle) ?? 0) + e.sets);
  return [...byMuscle.entries()]
    .map(([muscle, sets]) => ({ muscle, perWeek: Math.round((sets / weeks) * 10) / 10 }))
    .sort((a, b) => b.perWeek - a.perWeek);
}

/**
 * L'évolution du 1RM estimé d'un exercice sur la période : ses points, et l'écart en % entre la
 * première et la dernière séance chargée. Moins de deux séances chargées : rien à dire.
 */
export function strengthTrend(points: readonly { date: string; value: number }[]) {
  const charged = points.filter((p) => p.value > 0);
  const first = charged[0];
  const last = charged.at(-1);
  if (!first || !last || charged.length < 2) return null;
  return {
    points: charged,
    last: last.value,
    change: Math.round(((last.value - first.value) / first.value) * 1000) / 10,
  };
}

/** Par semaine : nombre de séances et durée moyenne, la plus ancienne d'abord. */
export function weeklySeries(
  sessions: { date: string; minutes: number }[],
  today: string,
  weeks: number,
) {
  const last = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(last, (i - weeks + 1) * 7);
    const these = sessions.filter((s) => startOfWeek(s.date) === week);
    const total = these.reduce((sum, s) => sum + s.minutes, 0);
    return {
      week,
      count: these.length,
      minutes: these.length ? Math.round(total / these.length) : 0,
    };
  });
}
