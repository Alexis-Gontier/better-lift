export type MockRecord = {
  id: string;
  exercise: string;
  slug: string;
  kind: string;
  value: string;
  date: string;
};

export const mockRecords: MockRecord[] = [
  {
    id: "r1",
    exercise: "Développé couché",
    slug: "developpe-couche",
    kind: "Charge",
    value: "92,5 kg × 3",
    date: "2026-10-15",
  },
  {
    id: "r2",
    exercise: "Tractions",
    slug: "tractions",
    kind: "Répétitions",
    value: "12 reps",
    date: "2026-10-13",
  },
  {
    id: "r3",
    exercise: "Squat",
    slug: "squat",
    kind: "1RM estimé",
    value: "138 kg",
    date: "2026-10-08",
  },
  {
    id: "r4",
    exercise: "Rowing barre",
    slug: "rowing",
    kind: "Volume",
    value: "2 400 kg",
    date: "2026-09-30",
  },
];
