import { Link } from "@tanstack/react-router";
import { Check, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDay, formatMinutes, formatWeekdayDay, plural } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { mockPlanned } from "@/mocks/planning";
import { estimateMinutes } from "@/mocks/routine-stats";
import { useRoutines } from "@/mocks/routine-store";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

/**
 * Aujourd'hui, en tête de l'Accueil (D270) : la routine prévue, ses muscles et sa durée ; faite,
 * la carte le dit et ouvre la séance ; un jour sans rien, « Repos » et la prochaine séance.
 */
export function TodayCard() {
  const routines = useRoutines();
  const done = useSessions().find((s) => s.date === TODAY);
  const plan = mockPlanned.find((p) => p.date === TODAY);
  const next = mockPlanned
    .filter((p) => p.date > TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const routine = routines.find((r) => r.id === plan?.routineId);
  const nextRoutine = routines.find((r) => r.id === next?.routineId);

  if (done)
    return (
      <Card>
        <CardHeader>
          <CardDescription className="first-letter:uppercase">
            Aujourd'hui · {formatDay(TODAY)}
          </CardDescription>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Check className="size-5" /> {done.routine}, faite
          </CardTitle>
          <CardAction>
            <Button variant="outline" asChild>
              <Link to="/history/$id" params={{ id: done.id }}>
                Voir la séance
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    );

  if (!routine)
    return (
      <Card>
        <CardHeader>
          <CardDescription className="first-letter:uppercase">
            Aujourd'hui · {formatDay(TODAY)}
          </CardDescription>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Moon className="size-5" /> Repos
          </CardTitle>
          <CardAction>
            <Button variant="outline" asChild>
              <Link to="/planning">Ouvrir le planning</Link>
            </Button>
          </CardAction>
        </CardHeader>
        {next && nextRoutine && (
          <CardContent className="text-muted-foreground text-sm">
            Prochaine séance : {nextRoutine.name},{" "}
            <span className="first-letter:lowercase">{formatWeekdayDay(next.date)}</span>.
          </CardContent>
        )}
      </Card>
    );

  const muscles = [
    ...new Set(routine.exercises.map((e) => exerciseBySlug(e.slug)?.muscle).filter(Boolean)),
  ];
  return (
    <Card>
      <CardHeader>
        <CardDescription className="first-letter:uppercase">
          Aujourd'hui · {formatDay(TODAY)}
        </CardDescription>
        <CardTitle className="text-2xl">{routine.name}</CardTitle>
        <CardAction>
          <Button asChild>
            <Link to="/routines/$id" params={{ id: routine.id }}>
              Voir la routine
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
        <span>
          {plural(routine.exercises.length, "exercice")} · ~
          {formatMinutes(estimateMinutes(routine.exercises))}
        </span>
        {muscles.map((m) => (
          <Badge key={m} variant="secondary">
            {m}
          </Badge>
        ))}
        <span className="basis-full pt-1 text-xs">On la lance depuis le téléphone, en salle.</span>
      </CardContent>
    </Card>
  );
}
