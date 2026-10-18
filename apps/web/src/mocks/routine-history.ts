import { estimate1rm } from "./exercise-stats";
import { strengthTrend } from "./progress";
import { daysSince } from "./routine-stats";
import type { MockRoutine } from "./routines";

/**
 * Les stats d'une routine (D279, D280), séance par séance : ce qui manquait au wireframe, qui
 * n'avait que des estimations. La routine est reconnue à son nom, comme dans l'historique.
 */

type RunSource = {
  session: {
    id: string;
    date: string;
    routine: string;
    minutes: number;
    volume: number;
    records: number;
  };
  exercises: { slug: string; sets: { kg: number | null; reps: number }[] }[];
};

export type RoutineRun = {
  id: string;
  date: string;
  minutes: number;
  volume: number;
  records: number;
  doneSets: number;
  plannedSets: number;
  /** Séries faites sur séries prévues (hors échauffement), plafonné à 1. */
  completion: number;
};

const plannedSetsOf = (routine: MockRoutine) =>
  routine.exercises.reduce((n, e) => n + e.sets.filter((s) => s.type !== "warmup").length, 0);

/** Les séances de la routine, la plus ancienne d'abord. */
export function routineRuns(routine: MockRoutine, details: RunSource[]): RoutineRun[] {
  const planned = plannedSetsOf(routine);
  return details
    .filter((d) => d.session.routine === routine.name)
    .map((d) => {
      const done = d.exercises.reduce((n, e) => n + e.sets.length, 0);
      return {
        id: d.session.id,
        date: d.session.date,
        minutes: d.session.minutes,
        volume: d.session.volume,
        records: d.session.records,
        doneSets: done,
        plannedSets: planned,
        completion: planned > 0 ? Math.min(1, done / planned) : 1,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Combien de fois, et tous les combien de jours en moyenne. */
export function runFrequency(runs: RoutineRun[]) {
  const first = runs[0];
  const last = runs.at(-1);
  return {
    count: runs.length,
    avgGapDays:
      first && last && runs.length > 1
        ? Math.round(daysSince(first.date, last.date) / (runs.length - 1))
        : null,
  };
}

/** Pour chaque exercice de la routine : la meilleure série de chaque séance et son évolution. */
export function routineLifts(routine: MockRoutine, details: RunSource[]) {
  const runs = details
    .filter((d) => d.session.routine === routine.name)
    .sort((a, b) => a.session.date.localeCompare(b.session.date));
  const slugs = [...new Set(routine.exercises.map((e) => e.slug))];
  return slugs.map((slug) => {
    const points = runs.flatMap((d) => {
      const sets = d.exercises.find((e) => e.slug === slug)?.sets ?? [];
      const value = Math.max(0, ...sets.map((s) => estimate1rm(s.kg ?? 0, s.reps)));
      return value > 0 ? [{ date: d.session.date, value: Math.round(value * 10) / 10 }] : [];
    });
    return { slug, points, change: strengthTrend(points)?.change ?? null };
  });
}
