import type { RoutineDetail, RoutineResume, SerieRoutine, TypeSerie } from "@better-lift/shared";

// Des slugs RÉELS du catalogue : le sélecteur d'exercice cherche déjà dans la
// vraie base, et le branchement ne changera que la source des routines.

const s = (
  type: TypeSerie,
  repsCible: number | null,
  chargeCibleKg: number | null,
): SerieRoutine => ({
  type,
  repsCible,
  chargeCibleKg,
});

const fois = (n: number, serie: SerieRoutine): SerieRoutine[] =>
  Array.from({ length: n }, () => serie);

// Un nom long face à deux très courts, des échauffements, une charge décimale et
// des séries sans charge (traction au poids du corps) : les cas qui révèlent
// troncature, alignement et formatage.
export const ROUTINES: RoutineDetail[] = [
  {
    id: "r1",
    nom: "Push — pectoraux, épaules, triceps",
    exercices: [
      {
        slug: "barbell-bench-press",
        nom: "Développé couché à la barre",
        reposSec: 180,
        series: [
          s("ECHAUFFEMENT", 10, 40),
          s("ECHAUFFEMENT", 5, 60),
          ...fois(4, s("NORMALE", 6, 82.5)),
        ],
      },
      {
        slug: "dumbbell-incline-bench-press",
        nom: "Développé couché incliné aux haltères",
        reposSec: 120,
        series: fois(3, s("NORMALE", 10, 28)),
      },
      {
        slug: "dumbbell-lateral-raise",
        nom: "Élévations latérales aux haltères",
        reposSec: 60,
        series: [...fois(2, s("NORMALE", 15, 10)), s("DEGRESSIVE", 12, 6)],
      },
      {
        slug: "cable-triceps-pushdown-v-bar",
        nom: "Pushdown triceps à la poulie (barre en V)",
        reposSec: null,
        series: [...fois(2, s("NORMALE", 12, 25)), s("ECHEC", null, 25)],
      },
    ],
  },
  {
    id: "r2",
    nom: "Pull",
    exercices: [
      {
        slug: "barbell-deadlift",
        nom: "Soulevé de terre à la barre",
        reposSec: 240,
        series: [s("ECHAUFFEMENT", 5, 60), ...fois(3, s("NORMALE", 5, 140))],
      },
      { slug: "pull-up", nom: "Traction", reposSec: 120, series: fois(4, s("NORMALE", 8, null)) },
      {
        slug: "dumbbell-bent-over-row",
        nom: "Rowing buste penché aux haltères",
        reposSec: 90,
        series: fois(3, s("NORMALE", 10, 32.5)),
      },
      {
        slug: "barbell-curl",
        nom: "Curl à la barre",
        reposSec: 60,
        series: fois(3, s("NORMALE", 10, 30)),
      },
    ],
  },
  {
    id: "r3",
    nom: "Legs",
    exercices: [
      {
        slug: "barbell-full-squat",
        nom: "Squat complet à la barre",
        reposSec: 180,
        series: [s("ECHAUFFEMENT", 8, 60), ...fois(4, s("NORMALE", 6, 110))],
      },
      {
        slug: "barbell-romanian-deadlift",
        nom: "Soulevé de terre roumain à la barre",
        reposSec: 120,
        series: fois(3, s("NORMALE", 8, 90)),
      },
      {
        slug: "sled-45-leg-press",
        nom: "Presse à cuisses 45°",
        reposSec: 90,
        series: fois(3, s("NORMALE", 12, 180)),
      },
    ],
  },
];

export function resumer(r: RoutineDetail): RoutineResume {
  return {
    id: r.id,
    nom: r.nom,
    nbExercices: r.exercices.length,
    nbSeries: r.exercices.reduce((n, e) => n + e.series.length, 0),
  };
}
