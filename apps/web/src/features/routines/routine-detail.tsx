import { formatDaysAgo, formatKg, formatMinutes, plural } from "@/lib/format";
import { daysSince, estimateMinutes, plannedVolume } from "@/mocks/routine-stats";
import type { MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";

/**
 * Ce que la routine représente, en une ligne (D250) : exercices, séries, durée et volume
 * estimés, dernière fois. Il suit la saisie : on voit ce qu'une retouche change.
 */
export function RoutineFigures({ routine }: { routine: MockRoutine }) {
  const sets = routine.exercises.reduce((n, e) => n + e.sets.length, 0);
  const figures = [
    plural(routine.exercises.length, "exercice"),
    plural(sets, "série"),
    `~${formatMinutes(estimateMinutes(routine.exercises))}`,
    `${formatKg(plannedVolume(routine.exercises))} prévus`,
    formatDaysAgo(routine.lastDone ? daysSince(routine.lastDone, TODAY) : null),
  ];
  return <span className="tabular-nums">{figures.join(" · ")}</span>;
}
