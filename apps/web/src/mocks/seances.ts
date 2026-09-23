export type SeanceFactice = {
  id: string;
  titre: string;
  debutIso: string;
  dureeMin: number;
  volumeKg: number;
  exercices: { nom: string; series: { kg: number; reps: number; record?: boolean }[] }[];
};

// `s1` commence à 23 h 30 heure de Paris, soit 21 h 30 UTC : c'est le cas qui
// rend le piège du fuseau visible à l'écran. Elle doit s'afficher au 20 septembre.
// Affichée au 21, c'est qu'une conversion UTC s'est glissée quelque part.
export const SEANCES: SeanceFactice[] = [
  {
    id: "s1",
    titre: "Push",
    debutIso: "2026-09-20T23:30:00+02:00",
    dureeMin: 62,
    volumeKg: 7420,
    exercices: [
      {
        nom: "Développé couché barre",
        series: [
          { kg: 80, reps: 8 },
          { kg: 85, reps: 5, record: true },
          { kg: 80, reps: 6 },
        ],
      },
      {
        nom: "Élévations latérales haltères",
        series: [
          { kg: 12, reps: 15 },
          { kg: 12, reps: 13 },
        ],
      },
    ],
  },
  {
    id: "s2",
    titre: "Legs",
    debutIso: "2026-09-18T18:15:00+02:00",
    dureeMin: 71,
    volumeKg: 11250,
    exercices: [
      {
        nom: "Squat barre",
        series: [
          { kg: 110, reps: 6 },
          { kg: 120, reps: 5, record: true },
        ],
      },
    ],
  },
];
