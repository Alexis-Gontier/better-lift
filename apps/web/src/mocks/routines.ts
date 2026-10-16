export type MockSet = { kg: number; reps: number };
export type MockRoutineExercise = {
  slug: string;
  sets: MockSet[];
  restSeconds: number;
  /** Lettre du superset : les exercices qui la partagent s'enchaînent. */
  superset?: string;
};
export type MockRoutine = {
  id: string;
  name: string;
  folder: string;
  lastDone: string | null;
  notes?: string;
  exercises: MockRoutineExercise[];
};

export const FOLDERS = ["Push", "Pull", "Jambes", "Haut du corps"] as const;

const sets = (kg: number, reps: number, n = 3): MockSet[] =>
  Array.from({ length: n }, () => ({ kg, reps }));

export const mockRoutines: MockRoutine[] = [
  {
    id: "1",
    name: "Push A",
    folder: "Push",
    lastDone: "2026-10-09",
    notes: "Échauffement épaules avant le développé.",
    exercises: [
      {
        slug: "developpe-couche",
        sets: [{ kg: 80, reps: 8 }, ...sets(85, 6, 3)],
        restSeconds: 150,
      },
      { slug: "developpe-militaire", sets: sets(45, 8), restSeconds: 120 },
      { slug: "elevations-laterales", sets: sets(10, 15), restSeconds: 60, superset: "A" },
      { slug: "extension-triceps-poulie", sets: sets(25, 12), restSeconds: 60, superset: "A" },
    ],
  },
  {
    id: "2",
    name: "Pull A",
    folder: "Pull",
    lastDone: "2026-10-10",
    exercises: [
      { slug: "tractions", sets: sets(0, 8, 4), restSeconds: 120 },
      { slug: "rowing", sets: sets(70, 8), restSeconds: 120 },
      { slug: "face-pull", sets: sets(20, 15), restSeconds: 60 },
      { slug: "curl-biceps", sets: sets(14, 10), restSeconds: 60 },
    ],
  },
  {
    id: "3",
    name: "Jambes A",
    folder: "Jambes",
    lastDone: "2026-10-11",
    exercises: [
      { slug: "squat", sets: [{ kg: 100, reps: 5 }, ...sets(115, 5, 3)], restSeconds: 180 },
      { slug: "presse-cuisses", sets: sets(180, 10), restSeconds: 120 },
      { slug: "leg-curl", sets: sets(45, 12), restSeconds: 90, superset: "A" },
      { slug: "mollets-debout", sets: sets(60, 15), restSeconds: 90, superset: "A" },
    ],
  },
  {
    id: "4",
    name: "Push B",
    folder: "Push",
    lastDone: "2026-10-02",
    exercises: [
      { slug: "developpe-incline-halteres", sets: sets(30, 10, 4), restSeconds: 120 },
      { slug: "dips", sets: sets(10, 10), restSeconds: 90 },
      { slug: "developpe-militaire", sets: sets(40, 10), restSeconds: 90 },
      { slug: "elevations-laterales", sets: sets(10, 15), restSeconds: 60 },
      { slug: "extension-triceps-poulie", sets: sets(25, 12), restSeconds: 60 },
      { slug: "face-pull", sets: sets(20, 15), restSeconds: 60 },
    ],
  },
  {
    id: "5",
    name: "Pull B",
    folder: "Pull",
    lastDone: "2026-10-03",
    exercises: [
      { slug: "souleve-de-terre", sets: sets(140, 5), restSeconds: 180 },
      { slug: "tirage-vertical", sets: sets(60, 10), restSeconds: 90 },
      { slug: "curl-biceps", sets: sets(14, 12), restSeconds: 60 },
    ],
  },
  {
    id: "6",
    name: "Haut du corps",
    folder: "Haut du corps",
    lastDone: "2026-10-03",
    exercises: [
      { slug: "developpe-couche", sets: sets(80, 8), restSeconds: 120 },
      { slug: "rowing", sets: sets(70, 8), restSeconds: 120 },
      { slug: "developpe-militaire", sets: sets(40, 10), restSeconds: 90 },
      { slug: "tractions", sets: sets(0, 8), restSeconds: 90 },
    ],
  },
  {
    id: "7",
    name: "Jambes B",
    folder: "Jambes",
    lastDone: null,
    exercises: [
      { slug: "souleve-de-terre", sets: sets(120, 6), restSeconds: 180 },
      { slug: "presse-cuisses", sets: sets(160, 12), restSeconds: 120 },
      { slug: "mollets-debout", sets: sets(60, 15, 4), restSeconds: 60 },
    ],
  },
];

export function routineById(id: string): MockRoutine | undefined {
  return mockRoutines.find((r) => r.id === id);
}
