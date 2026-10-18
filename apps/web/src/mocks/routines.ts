import { lastSets, workouts } from "./generated-workouts";

/** Le type d'une série, comme dans Hevy ; absent : une série normale. */
export type SetType = "warmup" | "drop" | "failure";

/** Une série ; charge `null` : pas encore de charge connue pour cet exercice. */
export type MockSet = { kg: number | null; reps: number; type?: SetType };
/** Une série prévue : charge et répétitions cibles facultatives, comme en base (`RoutineSerie`). */
type PlannedSet = Omit<MockSet, "reps"> & { reps: number | null };
export type MockRoutineExercise = {
  slug: string;
  sets: PlannedSet[];
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

/** La date de la dernière séance d'une routine, ou `null` si elle n'a jamais été faite. */
const lastDone = (name: string) => workouts.find((w) => w.routine === name)?.date ?? null;

/**
 * Un exercice de routine tel qu'en prod : répétitions visées et repos. La prod ne fixe pas de
 * charge ; on reprend, série par série, celle de la dernière fois (la dernière série connue
 * au-delà), comme le « précédent » de Hevy. Les séries d'échauffement sont omises.
 */
function exercise(slug: string, restSeconds: number, reps: number[]): MockRoutineExercise {
  const last = lastSets(slug);
  return {
    slug,
    restSeconds,
    sets: reps.map((r, i) => ({ kg: (last?.[i] ?? last?.at(-1))?.[0] ?? null, reps: r })),
  };
}

/** Les routines du compte de prod, dans leur ordre. */
export const mockRoutines: MockRoutine[] = [
  {
    id: "1",
    name: "Push",
    folder: "Push Pull Legs",
    lastDone: lastDone("Push"),
    exercises: [
      exercise("lever-seated-fly", 90, [15, 15, 15]),
      exercise("lever-chest-press", 150, [10, 10, 10]),
      exercise("dumbbell-incline-bench-press", 120, [10, 10, 10]),
      exercise("lever-seated-dip", 120, [15, 10, 6]),
      exercise("dumbbell-lateral-raise", 105, [12, 12, 12, 12, 12, 12, 12, 12]),
      exercise("barbell-lying-triceps-extension-skull-crusher", 90, [10, 10, 10]),
      exercise("lever-military-press", 105, [12, 12, 12]),
    ],
  },
  {
    id: "2",
    name: "Pull",
    folder: "Push Pull Legs",
    lastDone: lastDone("Pull"),
    exercises: [
      exercise("cable-one-arm-curl", 120, [12, 12, 12]),
      exercise("cable-hammer-curl-with-rope", 90, [10, 10, 10, 10]),
      exercise("cable-pulldown", 120, [10, 10, 10]),
      exercise("cable-seated-one-arm-alternate-row", 105, [12, 12, 12]),
      exercise("lever-t-bar-row", 120, [8, 8, 8, 8, 8]),
      exercise("cable-straight-arm-pulldown", 90, [15, 15, 15]),
      exercise("lever-seated-reverse-fly", 90, [10, 10, 10]),
    ],
  },
  {
    id: "3",
    name: "Full body",
    folder: "Full body",
    lastDone: lastDone("Full body"),
    exercises: [
      exercise("barbell-bench-press", 180, [6, 6, 6]),
      exercise("cable-pulldown", 150, [10, 10, 10]),
      exercise("cable-pushdown-with-rope-attachment", 105, [10, 10, 10, 10]),
      exercise("cable-hammer-curl-with-rope", 105, [10, 10, 10, 10]),
      exercise("lever-seated-dip", 120, [15, 10, 6]),
      exercise("dumbbell-lateral-raise", 105, [12, 12, 12, 12, 12, 12, 12, 12]),
      exercise("barbell-seated-overhead-press", 90, [12, 12, 12]),
    ],
  },
  {
    id: "4",
    name: "Legs",
    folder: "Push Pull Legs",
    lastDone: lastDone("Legs"),
    exercises: [
      exercise("sled-hack-squat", 180, [5, 5, 5, 5]),
      exercise("hack-calf-raise", 120, [15, 15, 15, 15]),
      exercise("lever-seated-leg-curl", 105, [10, 10, 10, 10]),
      exercise("lever-leg-extension", 90, [15, 15, 15, 15]),
      exercise("lever-seated-hip-adduction", 90, [12, 12, 12]),
    ],
  },
];
