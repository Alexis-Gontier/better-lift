import type { Planned } from "./calendar";
import { exerciseBySlug } from "./exercises";
import { estimateMinutes } from "./routine-stats";
import { mockRoutines, routineById } from "./routines";
import { mockSessions } from "./sessions";
import { addDays, startOfWeek } from "./stats";
import { TODAY } from "./today";

/** La routine planifiée aujourd'hui (vendredi) : Legs, d'après la semaine type. */
const todayRoutine = routineById("4");
export const mockToday = {
  routineId: "4",
  routine: todayRoutine?.name ?? "Legs",
  exercises: todayRoutine?.exercises.length ?? 0,
  minutes: estimateMinutes(todayRoutine?.exercises ?? []),
  muscles: [
    ...new Set(todayRoutine?.exercises.map((e) => exerciseBySlug(e.slug)?.muscle ?? "") ?? []),
  ].filter(Boolean),
};

/** Semaine type : jour (0 = lundi) → routine. Push le mardi, Pull le jeudi, Legs le vendredi. */
const TEMPLATE: [number, string][] = [
  [1, "1"],
  [3, "2"],
  [4, "4"],
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

/** Avant aujourd'hui : ce qui a été fait était planifié, plus le Pull de jeudi, manqué. */
const past: Planned[] = [
  ...mockSessions
    .filter((s) => s.date < TODAY && s.date >= addDays(TODAY, -42))
    .map((s) => ({
      id: `p-${s.id}`,
      date: s.date,
      routineId: mockRoutines.find((r) => r.name === s.routine)?.id ?? "1",
    })),
  { id: "p-manquee-1", date: "2026-10-15", routineId: "2" },
];

export const mockPlanned: Planned[] = [...past, ...future];
