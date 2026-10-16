import { addDays, startOfWeek } from "./stats";

export const PERIODS = [
  { value: "4s", label: "4 semaines", days: 28 },
  { value: "3m", label: "3 mois", days: 90 },
  { value: "1a", label: "1 an", days: 365 },
  { value: "tout", label: "Tout", days: null },
] as const;
export type Period = (typeof PERIODS)[number]["value"];

/** Premier jour de la période (inclus). « Tout » remonte au début des temps. */
export function periodStart(period: Period, today: string): string {
  const days = PERIODS.find((p) => p.value === period)?.days ?? null;
  return days === null ? "0000-01-01" : addDays(today, -days);
}

export function inPeriod<T extends { date: string }>(
  items: T[],
  period: Period,
  today: string,
): T[] {
  const start = periodStart(period, today);
  return items.filter((i) => i.date >= start && i.date <= today);
}

type DetailLike = { exercises: { muscle: string; volume: number }[] };

/** Volume et nombre de séances par muscle principal, le plus travaillé d'abord. */
export function muscleStats(details: DetailLike[], weeks: number) {
  const byMuscle = new Map<string, { volume: number; sessions: number }>();
  for (const d of details) {
    const seen = new Set<string>();
    for (const e of d.exercises) {
      const m = byMuscle.get(e.muscle) ?? { volume: 0, sessions: 0 };
      m.volume += e.volume;
      if (!seen.has(e.muscle)) {
        m.sessions += 1;
        seen.add(e.muscle);
      }
      byMuscle.set(e.muscle, m);
    }
  }
  return [...byMuscle.entries()]
    .map(([muscle, m]) => ({
      muscle,
      volume: m.volume,
      sessions: m.sessions,
      perWeek: Math.round((m.sessions / Math.max(1, weeks)) * 10) / 10,
    }))
    .sort((a, b) => b.volume - a.volume);
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
