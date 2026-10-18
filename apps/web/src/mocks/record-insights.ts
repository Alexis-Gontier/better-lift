import { best1rmOf, estimate1rm, type Performance } from "./exercise-stats";
import { strengthTrend } from "./progress";
import type { MockSet } from "./routines";
import { addDays, startOfWeek, weekStreak } from "./stats";

/**
 * Les records vus de l'avant (D275) : ce qu'on peut battre, ce qui monte, ce qui ne bouge plus.
 * Tout se dérive des séances, rien n'est stocké. Remplacé par `shared` au branchement de l'API.
 */

/** Un exercice est « à portée » s'il a été fait dans ces jours-là. */
const REACH_DAYS = 30;
/** Le plus petit saut de charge : deux disques de 1,25 kg. */
const STEP_KG = 2.5;
/** La tendance se lit sur quatre semaines. */
const TREND_DAYS = 28;
/** Stagnation : au moins 3 séances sur 6 semaines, sans record depuis 4 semaines. */
const STALL_WINDOW_DAYS = 42;
const STALL_MIN_SESSIONS = 3;
const STALL_DAYS = 28;

const oneRmOf = (s: MockSet) => estimate1rm(s.kg ?? 0, s.reps);

/** La meilleure série d'une exécution au 1RM estimé ; sans charge, la plus longue. */
export function topSet(p: Performance): MockSet | undefined {
  return p.sets.reduce<MockSet | undefined>((best, s) => {
    if (!best) return s;
    const a = oneRmOf(s);
    const b = oneRmOf(best);
    return a > b || (a === b && s.reps > best.reps) ? s : best;
  }, undefined);
}

export type Reach = {
  /** La dernière exécution, sur laquelle la cible est calculée. */
  date: string;
  /** La série qui suffit : une répétition de plus, sinon 2,5 kg de plus. */
  target: { kg: number | null; reps: number };
  /** Le record à battre : 1RM estimé, ou répétitions au poids du corps. */
  record: number;
  bodyweight: boolean;
};

/**
 * Un record atteignable à la prochaine séance : la dernière meilleure série, à une répétition
 * ou 2,5 kg près, battrait le 1RM estimé. Au poids du corps : égaler son record de répétitions
 * suffit pour viser une de plus.
 */
export function withinReach(history: Performance[], today: string): Reach | null {
  const last = history.at(-1);
  if (!last || last.date < addDays(today, -REACH_DAYS)) return null;
  const top = topSet(last);
  if (!top) return null;
  if (!top.kg) {
    const best = Math.max(...history.flatMap((p) => p.sets.map((s) => s.reps)));
    return top.reps >= best
      ? { date: last.date, target: { kg: null, reps: best + 1 }, record: best, bodyweight: true }
      : null;
  }
  const record = Math.max(...history.map(best1rmOf));
  const candidates = [
    { kg: top.kg, reps: top.reps + 1 },
    { kg: top.kg + STEP_KG, reps: top.reps },
  ];
  const target = candidates.find((c) => estimate1rm(c.kg, c.reps) > record);
  return target ? { date: last.date, target, record, bodyweight: false } : null;
}

export type Trend = { points: { date: string; value: number }[]; last: number; change: number };

/** L'évolution du 1RM estimé sur les quatre dernières semaines ; `null` sous deux séances. */
export function recentTrend(history: Performance[], today: string): Trend | null {
  const from = addDays(today, -TREND_DAYS);
  return strengthTrend(
    history.filter((p) => p.date >= from).map((p) => ({ date: p.date, value: best1rmOf(p) })),
  );
}

/**
 * Les dates où l'exercice a battu son 1RM estimé, comme dans l'historique : la première fois ne
 * compte pas, il n'y avait rien à battre.
 */
export function recordDates(history: Performance[]): string[] {
  const out: string[] = [];
  let best: number | undefined;
  for (const p of history) {
    const value = best1rmOf(p);
    if (best !== undefined && value > best) out.push(p.date);
    best = Math.max(best ?? 0, value);
  }
  return out;
}

/** Fait régulièrement, mais plus aucun record depuis quatre semaines. */
export function isStalled(history: Performance[], today: string): boolean {
  const recent = history.filter((p) => p.date >= addDays(today, -STALL_WINDOW_DAYS));
  if (recent.length < STALL_MIN_SESSIONS) return false;
  const last = recordDates(history).at(-1);
  return !last || last < addDays(today, -STALL_DAYS);
}

export type RecordEvent = {
  id: string;
  sessionId: string;
  date: string;
  slug: string;
  kg: number | null;
  reps: number;
};

type RecordSource = {
  session: { id: string; date: string };
  exercises: { slug: string; sets: { kg: number | null; reps: number; record?: boolean }[] }[];
};

/** Chaque série marquée record dans les séances, la plus récente d'abord. */
export function recordEvents(details: RecordSource[]): RecordEvent[] {
  return details
    .flatMap((d) =>
      d.exercises.flatMap((e) =>
        e.sets
          .filter((s) => s.record)
          .map((s) => ({
            id: `${d.session.id}-${e.slug}`,
            sessionId: d.session.id,
            date: d.session.date,
            slug: e.slug,
            kg: s.kg,
            reps: s.reps,
          })),
      ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Les records de la semaine, du mois civil, et les semaines d'affilée avec au moins un record. */
export function recordCounts(events: readonly { date: string }[], today: string) {
  const week = startOfWeek(today);
  const month = today.slice(0, 7);
  const past = events.filter((e) => e.date <= today);
  return {
    week: past.filter((e) => startOfWeek(e.date) === week).length,
    month: past.filter((e) => e.date.slice(0, 7) === month).length,
    streak: weekStreak(past, today),
  };
}

/** Regroupe des éléments déjà triés (le plus récent d'abord) par semaine, du lundi. */
export function groupByWeek<T extends { date: string }>(items: T[]) {
  const groups: { week: string; items: T[] }[] = [];
  for (const item of items) {
    const week = startOfWeek(item.date);
    const last = groups.at(-1);
    if (last?.week === week) last.items.push(item);
    else groups.push({ week, items: [item] });
  }
  return groups;
}
