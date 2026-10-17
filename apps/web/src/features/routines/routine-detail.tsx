import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDaysAgo, formatKg, formatMinutes } from "@/lib/format";
import { daysSince, estimateMinutes, plannedVolume } from "@/mocks/routine-stats";
import type { MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";
import { routineMuscles } from "./routine-card";

/** Ce que la routine représente : exercices, séries, durée et volume estimés, muscles. */
export function RoutineSummary({ routine }: { routine: MockRoutine }) {
  const sets = routine.exercises.reduce((n, e) => n + e.sets.length, 0);
  const items = [
    { label: "Exercices", value: String(routine.exercises.length) },
    { label: "Séries", value: String(sets) },
    { label: "Durée estimée", value: `~${formatMinutes(estimateMinutes(routine.exercises))}` },
    { label: "Volume prévu", value: formatKg(plannedVolume(routine.exercises)) },
    {
      label: "Dernière fois",
      value: formatDaysAgo(routine.lastDone ? daysSince(routine.lastDone, TODAY) : null),
    },
  ];
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 @lg:grid-cols-3 @3xl:grid-cols-5">
          {items.map((i) => (
            <div key={i.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">{i.label}</span>
              <span className="font-semibold tabular-nums">{i.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{routine.folder}</Badge>
          {routineMuscles(routine).map((m) => (
            <Badge key={m} variant="secondary">
              {m}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
