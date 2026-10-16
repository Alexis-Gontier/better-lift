import { Link } from "@tanstack/react-router";
import { useSelection } from "@/components/list-detail";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDaysAgo, formatMinutes } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { daysSince, estimateMinutes } from "@/mocks/routine-stats";
import type { MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";

/** Les muscles d'une routine, sans doublon, dans l'ordre des exercices. */
export function routineMuscles(routine: MockRoutine): string[] {
  const muscles = routine.exercises.map((e) => exerciseBySlug(e.slug)?.muscle ?? "");
  return [...new Set(muscles.filter(Boolean))];
}

export function RoutineCard({ routine }: { routine: MockRoutine }) {
  const muscles = routineMuscles(routine);
  const selection = useSelection();
  const card = (
    <Card className="h-full transition-colors group-hover:bg-muted/40 group-data-[selected=true]:ring-2 group-data-[selected=true]:ring-foreground/30">
      <CardHeader>
        <CardTitle>{routine.name}</CardTitle>
        <CardDescription>
          {routine.exercises.length} exercices · ~
          {formatMinutes(estimateMinutes(routine.exercises))}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {muscles.slice(0, 3).map((m) => (
          <Badge key={m} variant="secondary">
            {m}
          </Badge>
        ))}
        {muscles.length > 3 && <Badge variant="outline">+{muscles.length - 3}</Badge>}
      </CardContent>
      <CardFooter className="text-muted-foreground text-xs">
        {formatDaysAgo(routine.lastDone ? daysSince(routine.lastDone, TODAY) : null)}
      </CardFooter>
    </Card>
  );
  // En liste | détail, la carte sélectionne ; sinon elle mène à la page de la routine.
  return selection ? (
    <button
      type="button"
      className="group text-left"
      data-selected={selection.selected === routine.id}
      onClick={() => selection.select(routine.id)}
    >
      {card}
    </button>
  ) : (
    <Link to="/routines/$id" params={{ id: routine.id }} className="group">
      {card}
    </Link>
  );
}
