/**
 * Les séances réelles : l'export Hevy (`workouts.csv`, juillet 2026) et la séance de prod du
 * mardi 13 octobre 2026. Charge `null` : non notée. Les exercices Hevy portent le slug que les
 * routines de prod leur ont donné ; l'essai de 3 minutes du 3 janvier 2026 (« Entraînement de
 * nuit ») est écarté.
 */
export type RealSet = [kg: number | null, reps: number];
export type RealWorkout = {
  id: string;
  date: string;
  routine: string;
  minutes: number;
  exercises: { slug: string; sets: RealSet[] }[];
};

/** La plus récente d'abord. */
export const realWorkouts: RealWorkout[] = [
  {
    id: "s-mv5vlq5k-axbue3y8",
    date: "2026-10-13",
    routine: "Push",
    // Chronomètre oublié (2 h 43 enregistrées) : durée des Push de juillet, à 45 et 48 min.
    minutes: 47,
    exercises: [
      {
        slug: "lever-seated-fly",
        sets: [
          [25, 15],
          [25, 15],
          [20, 15],
        ],
      },
      {
        slug: "lever-chest-press",
        sets: [
          [80, 6],
          [70, 10],
          [65, 10],
        ],
      },
      {
        slug: "dumbbell-incline-bench-press",
        sets: [
          [28, 10],
          [28, 10],
          [28, 10],
        ],
      },
      {
        slug: "lever-seated-dip",
        sets: [
          [21, 15],
          [21, 10],
          [null, 6],
        ],
      },
      {
        slug: "dumbbell-lateral-raise",
        sets: [
          [8, 16],
          [8, 16],
          [5, 15],
          [5, 15],
        ],
      },
    ],
  },
  {
    id: "hevy-2026-07-29",
    date: "2026-07-29",
    routine: "Push",
    minutes: 48,
    exercises: [
      {
        slug: "lever-seated-fly",
        sets: [
          [25, 15],
          [25, 15],
          [20, 15],
        ],
      },
      {
        slug: "lever-chest-press",
        sets: [
          [85, 7],
          [80, 8],
          [75, 10],
        ],
      },
      {
        slug: "dumbbell-incline-bench-press",
        sets: [
          [26, 10],
          [26, 10],
          [26, 10],
        ],
      },
      {
        slug: "lever-seated-dip",
        sets: [
          [21, 15],
          [14, 10],
          [7, 6],
        ],
      },
      {
        slug: "dumbbell-lateral-raise",
        sets: [
          [8, 12],
          [8, 12],
          [6, 12],
          [6, 12],
        ],
      },
    ],
  },
  {
    id: "hevy-2026-07-26",
    date: "2026-07-26",
    routine: "Pull",
    minutes: 70,
    exercises: [
      {
        slug: "cable-one-arm-curl",
        sets: [
          [10, 12],
          [7.5, 12],
          [7.5, 12],
        ],
      },
      {
        slug: "cable-hammer-curl-with-rope",
        sets: [
          [null, 10],
          [null, 10],
          [null, 10],
        ],
      },
      {
        slug: "cable-pulldown",
        sets: [
          [50, 10],
          [45, 10],
          [45, 10],
        ],
      },
      {
        slug: "cable-seated-one-arm-alternate-row",
        sets: [
          [35, 12],
          [35, 12],
          [30, 12],
        ],
      },
      {
        slug: "lever-t-bar-row",
        sets: [
          [20, 8],
          [20, 8],
          [20, 8],
          [20, 8],
        ],
      },
      {
        slug: "cable-straight-arm-pulldown",
        sets: [
          [12.5, 15],
          [12.5, 15],
          [12.5, 15],
        ],
      },
      {
        slug: "lever-seated-reverse-fly",
        sets: [
          [7.5, 10],
          [7.5, 10],
          [7.5, 10],
        ],
      },
    ],
  },
  {
    id: "hevy-2026-07-24",
    date: "2026-07-24",
    routine: "Legs",
    minutes: 51,
    exercises: [
      {
        slug: "sled-hack-squat",
        sets: [
          [20, 5],
          [20, 5],
          [20, 5],
          [20, 5],
        ],
      },
      {
        slug: "hack-calf-raise",
        sets: [
          [25, 15],
          [25, 15],
          [25, 15],
          [20, 15],
        ],
      },
      {
        slug: "lever-seated-leg-curl",
        sets: [
          [40, 10],
          [45, 10],
          [40, 10],
          [40, 10],
        ],
      },
      {
        slug: "lever-leg-extension",
        sets: [
          [30, 15],
          [30, 15],
          [25, 15],
        ],
      },
      {
        slug: "lever-seated-hip-adduction",
        sets: [
          [45, 15],
          [40, 15],
          [35, 15],
        ],
      },
    ],
  },
  {
    id: "hevy-2026-07-23",
    date: "2026-07-23",
    routine: "Push",
    minutes: 45,
    exercises: [
      {
        slug: "lever-seated-fly",
        sets: [
          [20, 15],
          [20, 15],
          [20, 15],
        ],
      },
      {
        slug: "lever-chest-press",
        sets: [
          [70, 10],
          [70, 10],
          [65, 10],
        ],
      },
      {
        slug: "dumbbell-incline-bench-press",
        sets: [
          [24, 10],
          [24, 10],
          [24, 10],
        ],
      },
      { slug: "lever-seated-dip", sets: [[28, 15]] },
      {
        slug: "dumbbell-lateral-raise",
        sets: [
          [7, 12],
          [7, 12],
          [7, 12],
          [7, 12],
        ],
      },
      {
        slug: "dumbbell-seated-shoulder-press",
        sets: [
          [25, 12],
          [25, 12],
          [20, 12],
        ],
      },
    ],
  },
];

/** Les dernières séries faites d'un exercice, ou `undefined` s'il n'a jamais été fait. */
export function lastSets(slug: string): RealSet[] | undefined {
  return realWorkouts
    .find((w) => w.exercises.some((e) => e.slug === slug))
    ?.exercises.find((e) => e.slug === slug)?.sets;
}
