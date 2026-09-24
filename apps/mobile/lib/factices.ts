import type { RoutineDetail } from "@better-lift/shared";

// DESSIN (PR 1) : remplacées par l'API en PR 2. Des slugs RÉELS du catalogue,
// au format que l'API rendra, pour que le branchement ne change que la source.

export const ROUTINES: RoutineDetail[] = [
  {
    id: "r1",
    nom: "Push — pectoraux, épaules, triceps",
    exercices: [
      {
        slug: "barbell-bench-press",
        nom: "Développé couché à la barre",
        reposSec: 150,
        series: [
          { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
          { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
          { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
          { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
        ],
      },
      {
        slug: "dumbbell-lateral-raise",
        nom: "Élévations latérales aux haltères",
        reposSec: 60,
        series: [
          { type: "NORMALE", repsCible: 15, chargeCibleKg: 10 },
          { type: "NORMALE", repsCible: 15, chargeCibleKg: 10 },
        ],
      },
    ],
  },
  {
    id: "r2",
    nom: "Pull",
    exercices: [
      {
        slug: "pull-up",
        nom: "Traction",
        reposSec: 120,
        series: [
          { type: "NORMALE", repsCible: 8, chargeCibleKg: null },
          { type: "NORMALE", repsCible: 8, chargeCibleKg: null },
        ],
      },
    ],
  },
];

/** Un extrait du catalogue pour « + exercice » ; la vraie recherche arrive en PR 2. */
export const CATALOGUE: { slug: string; nom: string }[] = [
  { slug: "barbell-full-squat", nom: "Squat complet à la barre" },
  { slug: "barbell-deadlift", nom: "Soulevé de terre à la barre" },
  { slug: "barbell-curl", nom: "Curl à la barre" },
  { slug: "dumbbell-bent-over-row", nom: "Rowing buste penché aux haltères" },
  { slug: "cable-triceps-pushdown-v-bar", nom: "Pushdown triceps à la poulie (barre en V)" },
  { slug: "sled-45-leg-press", nom: "Presse à cuisses 45°" },
];
