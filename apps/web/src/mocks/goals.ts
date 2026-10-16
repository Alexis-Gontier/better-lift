export type MockGoal = { id: string; label: string; current: number; target: number; unit: string };

export const mockGoals: MockGoal[] = [
  { id: "bench", label: "Développé couché", current: 92.5, target: 100, unit: "kg" },
  { id: "squat", label: "Squat", current: 125, target: 140, unit: "kg" },
  { id: "weight", label: "Poids de corps", current: 79.6, target: 78, unit: "kg" },
];
