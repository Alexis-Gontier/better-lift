import type { MockSession } from "./sessions";
import { addDays } from "./stats";

/**
 * Les chiffres de l'Accueil (D287), sur des jours civils `YYYY-MM-DD`. La semaine commence le
 * lundi. Remplacés par `shared` et l'API au branchement.
 */

/** Le lundi de la semaine du jour. */
export function weekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = dimanche
  return addDays(date, -((weekday + 6) % 7));
}

export type Totals = { count: number; volume: number; records: number; minutes: number };

/** Les séances de `from` à `to`, bornes comprises, additionnées. */
function totals(sessions: MockSession[], from: string, to: string): Totals {
  const t: Totals = { count: 0, volume: 0, records: 0, minutes: 0 };
  for (const s of sessions) {
    if (s.date < from || s.date > to) continue;
    t.count++;
    t.volume += s.volume;
    t.records += s.records;
    t.minutes += s.minutes;
  }
  return t;
}

export type Week = Totals & { start: string };

/** Les `weeks` dernières semaines, la semaine en cours comprise, de la plus ancienne à la plus récente. */
export function weeklyTotals(sessions: MockSession[], today: string, weeks: number): Week[] {
  const current = weekStart(today);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(current, (i - weeks + 1) * 7);
    return { start, ...totals(sessions, start, addDays(start, 6)) };
  });
}

/**
 * La période de `days` jours finissant aujourd'hui, et la même juste avant : de quoi dire
 * « +6 % sur 4 semaines ».
 */
export function comparedPeriods(sessions: MockSession[], today: string, days: number) {
  const from = addDays(today, -(days - 1));
  return {
    now: totals(sessions, from, today),
    before: totals(sessions, addDays(from, -days), addDays(from, -1)),
  };
}

export type DayActivity = { date: string; count: number; level: number };

/**
 * Un jour par case, sur les `weeks` dernières semaines (calendrier façon GitHub). Le niveau, de
 * 1 à 4, suit le volume du jour face aux autres jours d'entraînement (quartiles) ; 0 sans séance.
 */
export function dailyActivity(
  sessions: MockSession[],
  today: string,
  weeks: number,
): DayActivity[] {
  const from = addDays(weekStart(today), -(weeks - 1) * 7);
  const byDay = new Map<string, { count: number; volume: number }>();
  for (const s of sessions) {
    if (s.date < from || s.date > today) continue;
    const d = byDay.get(s.date) ?? { count: 0, volume: 0 };
    byDay.set(s.date, { count: d.count + 1, volume: d.volume + s.volume });
  }
  const volumes = [...byDay.values()].map((d) => d.volume).sort((a, b) => a - b);
  const quartile = (q: number) => volumes[Math.floor((volumes.length - 1) * q)] ?? 0;
  const cuts = [quartile(0.25), quartile(0.5), quartile(0.75)];
  const days: DayActivity[] = [];
  for (let date = from; date <= today; date = addDays(date, 1)) {
    const d = byDay.get(date);
    const level = d ? 1 + cuts.filter((c) => d.volume > c).length : 0;
    days.push({ date, count: d?.count ?? 0, level });
  }
  return days;
}

/** Combien de séances par routine depuis `from`, la plus faite d'abord. */
export function sessionsByRoutine(sessions: MockSession[], from: string) {
  const counts = new Map<string, number>();
  for (const s of sessions)
    if (s.date >= from) counts.set(s.routine, (counts.get(s.routine) ?? 0) + 1);
  return [...counts]
    .map(([routine, count]) => ({ routine, count }))
    .sort((a, b) => b.count - a.count || a.routine.localeCompare(b.routine, "fr"));
}

/**
 * Les semaines d'affilée à l'objectif, en remontant depuis la dernière. La semaine en cours compte
 * si l'objectif est déjà atteint, et ne casse pas la série sinon : elle n'est pas finie.
 */
export function goalStreak(weeks: Week[], goal: number): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const reached = (weeks[i]?.count ?? 0) >= goal;
    if (reached) streak++;
    else if (i !== weeks.length - 1) break;
  }
  return streak;
}
