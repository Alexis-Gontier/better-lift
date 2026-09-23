export type RoutineFactice = {
  id: string;
  nom: string;
  exercices: { nom: string; series: number; repsCible: string }[];
};

// Un nom long face à deux très courts : c'est ce contraste qui révèle la
// troncature et l'alignement, pas une liste de libellés également sages.
export const ROUTINES: RoutineFactice[] = [
  {
    id: "r1",
    nom: "Push — pectoraux, épaules, triceps",
    exercices: [
      { nom: "Développé couché barre", series: 4, repsCible: "6–8" },
      { nom: "Développé incliné haltères", series: 3, repsCible: "8–10" },
      { nom: "Élévations latérales haltères", series: 3, repsCible: "12–15" },
      { nom: "Pushdown triceps à la poulie", series: 3, repsCible: "10–12" },
    ],
  },
  {
    id: "r2",
    nom: "Pull",
    exercices: [
      { nom: "Soulevé de terre barre", series: 3, repsCible: "3–5" },
      { nom: "Traction pronation", series: 4, repsCible: "6–8" },
      { nom: "Rowing haltère à un bras", series: 3, repsCible: "8–10" },
      { nom: "Curl barre", series: 3, repsCible: "8–12" },
    ],
  },
  {
    id: "r3",
    nom: "Legs",
    exercices: [
      { nom: "Squat barre", series: 4, repsCible: "5–8" },
      { nom: "Soulevé de terre roumain", series: 3, repsCible: "8–10" },
      { nom: "Presse à cuisses", series: 3, repsCible: "10–12" },
    ],
  },
];
