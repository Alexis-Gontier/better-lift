/** Ce qu'un export CSV de Hevy donnerait une fois lu (simulé : pas d'API dans le wireframe). */
export type HevyExercise = {
  /** Nom tel qu'il apparaît dans le fichier Hevy. */
  name: string;
  sets: number;
  /** Correspondance proposée dans le catalogue, ou `null` s'il n'y en a pas d'évidente. */
  guess: string | null;
};

/** Le vrai `workouts.csv` : 5 séances, 77 séries. Sans correspondance évidente : `null`. */
export const mockHevyImport = {
  sessions: 5,
  from: "2026-01-03",
  to: "2026-07-29",
  exercises: [
    { name: "Lateral Raise (Dumbbell)", sets: 8, guess: "dumbbell-lateral-raise" },
    { name: "Butterfly (Pec Deck)", sets: 6, guess: "lever-seated-fly" },
    { name: "Chest Press (Machine)", sets: 6, guess: "lever-chest-press" },
    { name: "Incline Bench Press (Dumbbell)", sets: 6, guess: "dumbbell-incline-bench-press" },
    { name: "Chest Dip (Assisted)", sets: 4, guess: "lever-seated-dip" },
    { name: "T Bar Row", sets: 4, guess: "lever-t-bar-row" },
    { name: "Hack Squat (Machine)", sets: 4, guess: "sled-hack-squat" },
    { name: "Seated Calf Raise", sets: 4, guess: null },
    { name: "Seated Leg Curl (Machine)", sets: 4, guess: "lever-seated-leg-curl" },
    { name: "Bench Press (Barbell)", sets: 4, guess: "barbell-bench-press" },
    { name: "Single Arm Curl (Cable)", sets: 3, guess: "cable-one-arm-curl" },
    { name: "Hammer Curl (Cable)", sets: 3, guess: "cable-hammer-curl-with-rope" },
    { name: "Lat Pulldown (Machine)", sets: 3, guess: "cable-pulldown" },
    { name: "Seated Cable Row - V Grip (Cable)", sets: 3, guess: null },
    { name: "Straight Arm Lat Pulldown (Cable)", sets: 3, guess: "cable-straight-arm-pulldown" },
    { name: "Reverse Fly Single Arm (Cable)", sets: 3, guess: null },
    { name: "Leg Extension (Machine)", sets: 3, guess: "lever-leg-extension" },
    { name: "Hip Adduction (Machine)", sets: 3, guess: "lever-seated-hip-adduction" },
    { name: "Overhead Press (Dumbbell)", sets: 3, guess: "dumbbell-seated-shoulder-press" },
  ] satisfies HevyExercise[],
};
