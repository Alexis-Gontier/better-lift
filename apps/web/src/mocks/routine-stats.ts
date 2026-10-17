import type { MockRoutineExercise } from "./routines";

/** Effort moyen d'une série, avant son repos. */
const SET_SECONDS = 45;

export function plannedVolume(exercises: MockRoutineExercise[]): number {
  return exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + (set.kg ?? 0) * set.reps, 0),
    0,
  );
}

/** Durée estimée : effort + repos de chaque série, arrondie aux 5 minutes supérieures. */
export function estimateMinutes(exercises: MockRoutineExercise[]): number {
  const seconds = exercises.reduce(
    (sum, e) => sum + e.sets.length * (SET_SECONDS + e.restSeconds),
    0,
  );
  return Math.ceil(seconds / 60 / 5) * 5;
}

/** Regroupe les exercices consécutifs d'un même superset ; un exercice seul forme son groupe. */
export function groupSupersets(exercises: MockRoutineExercise[]): MockRoutineExercise[][] {
  const groups: MockRoutineExercise[][] = [];
  for (const e of exercises) {
    const last = groups.at(-1);
    if (e.superset && last?.[0]?.superset === e.superset) last.push(e);
    else groups.push([e]);
  }
  return groups;
}

export function daysSince(date: string, today: string): number {
  return Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
}

type MuscleInfo = { muscle: string; secondary?: string[] } | undefined;

/**
 * Les séries de travail par muscle principal, de la plus chargée à la moins chargée : ce que la
 * routine fait travailler (D253). Les échauffements ne comptent pas.
 */
export function setsByMuscle(
  exercises: readonly MockRoutineExercise[],
  infoOf: (slug: string) => MuscleInfo,
): { muscle: string; sets: number }[] {
  const counts = new Map<string, number>();
  for (const e of exercises) {
    const muscle = infoOf(e.slug)?.muscle;
    if (!muscle) continue;
    const working = e.sets.filter((s) => s.type !== "warmup").length;
    counts.set(muscle, (counts.get(muscle) ?? 0) + working);
  }
  return [...counts]
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle, "fr"));
}

/** Les muscles à colorer sur la silhouette : principaux, puis secondaires qui ne le sont pas déjà. */
export function bodyMuscles(
  exercises: readonly MockRoutineExercise[],
  infoOf: (slug: string) => MuscleInfo,
): { primary: string[]; secondary: string[] } {
  const primary = new Set<string>();
  const secondary = new Set<string>();
  for (const e of exercises) {
    const info = infoOf(e.slug);
    if (!info) continue;
    primary.add(info.muscle);
    for (const m of info.secondary ?? []) secondary.add(m);
  }
  return { primary: [...primary], secondary: [...secondary].filter((m) => !primary.has(m)) };
}
