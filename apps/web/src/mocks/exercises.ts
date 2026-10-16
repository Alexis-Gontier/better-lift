export type MockExercise = {
  slug: string;
  name: string;
  muscle: string;
  equipment: string;
  /** Muscles secondaires sollicités. */
  secondary?: string[];
  /** Créé par l'utilisateur, hors catalogue. */
  custom?: boolean;
  /** Note personnelle épinglée. */
  note?: string;
};

export const mockExercises: MockExercise[] = [
  {
    slug: "developpe-couche",
    name: "Développé couché",
    muscle: "Pectoraux",
    equipment: "Barre",
    secondary: ["Triceps", "Épaules"],
    note: "Banc cran 0, prise un pouce au-delà des anneaux.",
  },
  {
    slug: "developpe-incline-halteres",
    name: "Développé incliné haltères",
    muscle: "Pectoraux",
    equipment: "Haltères",
  },
  { slug: "dips", name: "Dips", muscle: "Triceps", equipment: "Poids du corps" },
  {
    slug: "developpe-militaire",
    name: "Développé militaire",
    muscle: "Épaules",
    equipment: "Barre",
  },
  {
    slug: "elevations-laterales",
    name: "Élévations latérales",
    muscle: "Épaules",
    equipment: "Haltères",
  },
  {
    slug: "extension-triceps-poulie",
    name: "Extension triceps poulie",
    muscle: "Triceps",
    equipment: "Poulie",
  },
  { slug: "tractions", name: "Tractions", muscle: "Dos", equipment: "Poids du corps" },
  { slug: "rowing", name: "Rowing barre", muscle: "Dos", equipment: "Barre" },
  { slug: "tirage-vertical", name: "Tirage vertical", muscle: "Dos", equipment: "Poulie" },
  { slug: "curl-biceps", name: "Curl biceps", muscle: "Biceps", equipment: "Haltères" },
  { slug: "face-pull", name: "Face pull", muscle: "Épaules", equipment: "Poulie" },
  {
    slug: "squat",
    name: "Squat",
    muscle: "Quadriceps",
    equipment: "Barre",
    secondary: ["Fessiers", "Ischios"],
    note: "Barre haute, chaussures plates.",
  },
  { slug: "souleve-de-terre", name: "Soulevé de terre", muscle: "Ischios", equipment: "Barre" },
  { slug: "presse-cuisses", name: "Presse à cuisses", muscle: "Quadriceps", equipment: "Machine" },
  { slug: "leg-curl", name: "Leg curl", muscle: "Ischios", equipment: "Machine" },
  { slug: "mollets-debout", name: "Mollets debout", muscle: "Mollets", equipment: "Machine" },
  {
    slug: "hip-thrust",
    name: "Hip thrust machine",
    muscle: "Fessiers",
    equipment: "Machine",
    custom: true,
    note: "Machine de la salle du bas.",
  },
  {
    slug: "curl-marteau-poulie",
    name: "Curl marteau à la poulie",
    muscle: "Biceps",
    equipment: "Poulie",
    custom: true,
  },
];

export const MUSCLES = [...new Set(mockExercises.map((e) => e.muscle))];
export const EQUIPMENTS = [...new Set(mockExercises.map((e) => e.equipment))];

export function exerciseBySlug(slug: string): MockExercise | undefined {
  return mockExercises.find((e) => e.slug === slug);
}
