export type MockGoal = {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  /** Exercice visé, pour tracer l'objectif sur sa courbe. */
  slug?: string;
};

/** Objectifs d'exemple ; « actuel » = la plus lourde charge réellement faite. */
export const mockGoals: MockGoal[] = [
  {
    id: "chest-press",
    label: "Développé pectoraux à la machine",
    current: 85,
    target: 90,
    unit: "kg",
    slug: "lever-chest-press",
  },
  {
    id: "incline",
    label: "Développé incliné aux haltères",
    current: 28,
    target: 32,
    unit: "kg",
    slug: "dumbbell-incline-bench-press",
  },
  { id: "weight", label: "Poids de corps", current: 79.6, target: 78, unit: "kg" },
];
