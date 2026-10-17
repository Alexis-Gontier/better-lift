import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, Copy, Trash2 } from "lucide-react";
import { listLinkProps } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
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

/** Le clic droit sur une routine. Sans API, Dupliquer et Supprimer ne font encore rien. */
function routineActions(navigate: ReturnType<typeof useNavigate>): RowAction[] {
  return [
    { label: "Planifier", icon: CalendarPlus, onSelect: () => navigate({ to: "/planning" }) },
    { label: "Dupliquer", icon: Copy, onSelect: () => {} },
    { label: "Supprimer", icon: Trash2, onSelect: () => {}, destructive: true, separated: true },
  ];
}

export function RoutineCard({ routine }: { routine: MockRoutine }) {
  const navigate = useNavigate();
  const muscles = routineMuscles(routine);
  const card = (
    <Card className="h-full transition-colors group-hover:bg-muted/40 group-data-[status=active]:ring-2 group-data-[status=active]:ring-foreground/30">
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
  return (
    <RowMenu actions={routineActions(navigate)}>
      <Link to="/routines/$id" params={{ id: routine.id }} {...listLinkProps} className="group">
        {card}
      </Link>
    </RowMenu>
  );
}
