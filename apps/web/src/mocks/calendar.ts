import { addDays, startOfWeek } from "./stats";

export type Planned = { id: string; date: string; routineId: string };
type DoneLike = { id: string; date: string; routine: string };

export type DayEntry =
  | { kind: "done"; id: string; routine: string }
  | { kind: "planned" | "missed"; id: string; routine: string; routineId: string };

/** Les 7 jours de la semaine de `date`, du lundi au dimanche. */
export function weekDays(date: string): string[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Semaines complètes couvrant le mois `YYYY-MM`, du lundi au dimanche. */
export function monthGrid(month: string): string[][] {
  const first = `${month}-01`;
  const weeks: string[][] = [];
  let monday = startOfWeek(first);
  while (monday.slice(0, 7) <= month || weeks.length === 0) {
    weeks.push(weekDays(monday));
    monday = addDays(monday, 7);
  }
  return weeks;
}

/**
 * Ce qu'affiche un jour : les séances faites, puis les routines planifiées qu'aucune séance
 * du jour n'a couvertes — manquées si le jour est passé, à venir sinon.
 */
export function dayEntries(
  date: string,
  sessions: DoneLike[],
  planned: Planned[],
  today: string,
  routineName: (id: string) => string,
): DayEntry[] {
  const done = sessions.filter((s) => s.date === date);
  const doneNames = new Set(done.map((s) => s.routine));
  const rest = planned
    .filter((p) => p.date === date && !doneNames.has(routineName(p.routineId)))
    .map((p) => ({
      kind: date < today ? ("missed" as const) : ("planned" as const),
      id: p.id,
      routine: routineName(p.routineId),
      routineId: p.routineId,
    }));
  return [...done.map((s) => ({ kind: "done" as const, id: s.id, routine: s.routine })), ...rest];
}

/** Recopie les routines de la semaine qui commence le `weekStart` sur les `weeks` semaines suivantes. */
export function repeatWeek(planned: Planned[], weekStart: string, weeks: number): Planned[] {
  const end = addDays(weekStart, 6);
  const source = planned.filter((p) => p.date >= weekStart && p.date <= end);
  const key = (p: { date: string; routineId: string }) => `${p.date}:${p.routineId}`;
  const existing = new Set(planned.map(key));
  const added: Planned[] = [];
  for (let k = 1; k <= weeks; k++) {
    for (const p of source) {
      const copy = { id: `${p.id}-r${k}`, date: addDays(p.date, 7 * k), routineId: p.routineId };
      if (!existing.has(key(copy))) {
        existing.add(key(copy));
        added.push(copy);
      }
    }
  }
  return [...planned, ...added];
}

/** Déplace une séance prévue sur un autre jour (glisser-déposer, D269). */
export function movePlanned(planned: readonly Planned[], id: string, date: string): Planned[] {
  return planned.map((p) => (p.id === id ? { ...p, date } : p));
}

/** Les jours qui portent quelque chose, faite ou prévue : les points du mini-calendrier. */
export function busyDays(
  planned: readonly Planned[],
  done: readonly { date: string }[],
): Set<string> {
  return new Set([...planned.map((p) => p.date), ...done.map((d) => d.date)]);
}
