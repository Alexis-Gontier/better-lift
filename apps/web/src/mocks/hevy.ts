/** Ce qu'un export CSV de Hevy donnerait une fois lu (simulé : pas d'API dans le wireframe). */
export type HevyExercise = {
  /** Nom tel qu'il apparaît dans le fichier Hevy. */
  name: string;
  sets: number;
  /** Correspondance proposée dans le catalogue, ou `null` s'il n'y en a pas d'évidente. */
  guess: string | null;
};

export const mockHevyImport = {
  sessions: 312,
  from: "2024-01-08",
  to: "2026-09-27",
  exercises: [
    { name: "Bench Press (Barbell)", sets: 568, guess: "developpe-couche" },
    { name: "Squat (Barbell)", sets: 472, guess: "squat" },
    { name: "Deadlift (Barbell)", sets: 256, guess: "souleve-de-terre" },
    { name: "Pull Up", sets: 384, guess: "tractions" },
    { name: "Lateral Raise (Dumbbell)", sets: 352, guess: "elevations-laterales" },
    { name: "Bicep Curl (Dumbbell)", sets: 280, guess: "curl-biceps" },
    { name: "Overhead Press (Barbell)", sets: 300, guess: "developpe-militaire" },
    { name: "Cable Fly Crossovers", sets: 88, guess: null },
    { name: "Hack Squat (Machine)", sets: 60, guess: null },
  ] satisfies HevyExercise[],
};
