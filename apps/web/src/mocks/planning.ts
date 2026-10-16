import type { Planned } from "./calendar";
import { mockRoutines } from "./routines";
import { mockSessions } from "./sessions";
import { addDays, startOfWeek } from "./stats";
import { TODAY } from "./today";

/** La routine planifiée aujourd'hui (passe 3 : une seule, fixe). */
export const mockToday = {
  routineId: "4",
  routine: "Push B",
  exercises: 6,
  minutes: 65,
  muscles: ["Pectoraux", "Épaules", "Triceps"],
};

/** Semaine type : jour (0 = lundi) → routine. */
const TEMPLATE: [number, string][] = [
  [0, "1"],
  [1, "2"],
  [3, "3"],
  [4, "4"],
  [5, "5"],
];

/** À partir d'aujourd'hui : la semaine type, sur quatre semaines. */
const future: Planned[] = Array.from({ length: 5 }, (_, w) =>
  TEMPLATE.map(([day, routineId]) => {
    const date = addDays(startOfWeek(TODAY), w * 7 + day);
    return { id: `p-${date}-${routineId}`, date, routineId };
  }),
)
  .flat()
  .filter((p) => p.date >= TODAY);

/** Avant aujourd'hui : ce qui a été fait était planifié, plus deux séances manquées. */
const past: Planned[] = [
  ...mockSessions
    .filter((s) => s.date < TODAY && s.date >= addDays(TODAY, -42))
    .map((s) => ({
      id: `p-${s.id}`,
      date: s.date,
      routineId: mockRoutines.find((r) => r.name === s.routine)?.id ?? "1",
    })),
  { id: "p-manquee-1", date: "2026-10-14", routineId: "3" },
  { id: "p-manquee-2", date: "2026-10-07", routineId: "5" },
];

export const mockPlanned: Planned[] = [...past, ...future];
