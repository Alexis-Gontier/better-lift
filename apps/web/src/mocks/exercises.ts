export type MockExercise = {
  slug: string;
  name: string;
  muscle: string;
  equipment: string;
  /** Muscles secondaires sollicités. */
  secondary?: string[];
  /** Note personnelle épinglée. */
  note?: string;
};

/**
 * Les exercices réellement utilisés (routines de prod et export Hevy), tels que le catalogue
 * de prod les nomme : slug, nom français, muscle visé, équipement, muscles secondaires.
 */
export const mockExercises: MockExercise[] = [
  {
    slug: "lever-seated-fly",
    name: "Écarté assis à la machine",
    muscle: "Pectoraux",
    equipment: "Machine à levier",
    secondary: ["Deltoïdes", "Trapèzes"],
  },
  {
    slug: "lever-chest-press",
    name: "Développé pectoraux à la machine",
    muscle: "Pectoraux",
    equipment: "Machine à levier",
    secondary: ["Triceps", "Épaules"],
  },
  {
    slug: "dumbbell-incline-bench-press",
    name: "Développé couché incliné aux haltères",
    muscle: "Pectoraux",
    equipment: "Haltères",
    secondary: ["Épaules", "Triceps"],
  },
  {
    slug: "barbell-bench-press",
    name: "Développé couché à la barre",
    muscle: "Pectoraux",
    equipment: "Barre",
    secondary: ["Triceps", "Épaules"],
  },
  {
    slug: "lever-seated-dip",
    name: "Dips assis à la machine",
    muscle: "Triceps",
    equipment: "Machine à levier",
    secondary: ["Pectoraux", "Épaules"],
  },
  {
    slug: "barbell-lying-triceps-extension-skull-crusher",
    name: "Barre au front",
    muscle: "Triceps",
    equipment: "Barre",
    secondary: ["Épaules"],
  },
  {
    slug: "cable-pushdown-with-rope-attachment",
    name: "Pushdown à la poulie (corde)",
    muscle: "Triceps",
    equipment: "Poulie",
    secondary: ["Avant-bras"],
  },
  {
    slug: "dumbbell-lateral-raise",
    name: "Élévations latérales aux haltères",
    muscle: "Deltoïdes",
    equipment: "Haltères",
    secondary: ["Trapèzes"],
  },
  {
    slug: "lever-military-press",
    name: "Développé militaire à la machine",
    muscle: "Deltoïdes",
    equipment: "Machine à levier",
    secondary: ["Triceps", "Haut des pectoraux"],
  },
  {
    slug: "dumbbell-seated-shoulder-press",
    name: "Développé militaire assis aux haltères",
    muscle: "Deltoïdes",
    equipment: "Haltères",
    secondary: ["Triceps", "Haut du dos"],
  },
  {
    slug: "barbell-seated-overhead-press",
    name: "Développé militaire assis à la barre",
    muscle: "Deltoïdes",
    equipment: "Barre",
    secondary: ["Triceps", "Haut du dos"],
  },
  {
    slug: "lever-seated-reverse-fly",
    name: "Écarté inversé assis à la machine",
    muscle: "Deltoïdes",
    equipment: "Machine à levier",
    secondary: ["Trapèzes", "Rhomboïdes"],
  },
  {
    slug: "cable-one-arm-curl",
    name: "Curl à un bras à la poulie",
    muscle: "Biceps",
    equipment: "Poulie",
    secondary: ["Avant-bras"],
  },
  {
    slug: "cable-hammer-curl-with-rope",
    name: "Curl marteau à la poulie (corde)",
    muscle: "Biceps",
    equipment: "Poulie",
    secondary: ["Avant-bras"],
  },
  {
    slug: "cable-pulldown",
    name: "Tirage vertical à la poulie",
    muscle: "Grand dorsal",
    equipment: "Poulie",
    secondary: ["Biceps", "Avant-bras"],
  },
  {
    slug: "cable-straight-arm-pulldown",
    name: "Tirage bras tendus à la poulie",
    muscle: "Grand dorsal",
    equipment: "Poulie",
    secondary: ["Épaules", "Biceps"],
  },
  {
    slug: "cable-seated-one-arm-alternate-row",
    name: "Rowing assis alterné à un bras à la poulie",
    muscle: "Haut du dos",
    equipment: "Poulie",
    secondary: ["Biceps", "Avant-bras"],
  },
  {
    slug: "lever-t-bar-row",
    name: "Rowing T-bar à la machine",
    muscle: "Haut du dos",
    equipment: "Machine à levier",
    secondary: ["Biceps", "Avant-bras"],
  },
  {
    slug: "sled-hack-squat",
    name: "Hack squat à la machine",
    muscle: "Fessiers",
    equipment: "Machine guidée",
    secondary: ["Quadriceps", "Ischio-jambiers", "Mollets"],
  },
  {
    slug: "lever-leg-extension",
    name: "Leg extension à la machine",
    muscle: "Quadriceps",
    equipment: "Machine à levier",
    secondary: ["Ischio-jambiers"],
  },
  {
    slug: "lever-seated-leg-curl",
    name: "Leg curl assis à la machine",
    muscle: "Ischio-jambiers",
    equipment: "Machine à levier",
    secondary: ["Mollets"],
  },
  {
    slug: "lever-seated-hip-adduction",
    name: "Adduction de hanche assis à la machine",
    muscle: "Adducteurs",
    equipment: "Machine à levier",
    secondary: ["Ischio-jambiers", "Fessiers"],
  },
  {
    slug: "hack-calf-raise",
    name: "Extension des mollets au hack squat",
    muscle: "Mollets",
    equipment: "Machine guidée",
    secondary: ["Ischio-jambiers", "Fessiers"],
  },
];

export const MUSCLES = [...new Set(mockExercises.map((e) => e.muscle))];
export const EQUIPMENTS = [...new Set(mockExercises.map((e) => e.equipment))];

export function exerciseBySlug(slug: string): MockExercise | undefined {
  return mockExercises.find((e) => e.slug === slug);
}
