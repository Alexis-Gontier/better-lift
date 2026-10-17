import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDaysAgo, formatKg, formatLoad, formatMinutes, formatRest } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { daysSince, estimateMinutes, groupSupersets, plannedVolume } from "@/mocks/routine-stats";
import type { MockRoutine, MockRoutineExercise } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";
import { routineMuscles } from "./routine-card";

function Summary({ routine }: { routine: MockRoutine }) {
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
        {routine.notes && <p className="text-muted-foreground text-sm">{routine.notes}</p>}
      </CardContent>
    </Card>
  );
}

function ExerciseBlock({ exercise }: { exercise: MockRoutineExercise }) {
  const info = exerciseBySlug(exercise.slug);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <Link
            to="/exercises/$slug"
            params={{ slug: exercise.slug }}
            className="font-medium hover:underline"
          >
            {info?.name ?? exercise.slug}
          </Link>
          <span className="text-muted-foreground text-xs">
            {info?.muscle} · {info?.equipment}
          </span>
        </div>
        <Badge variant="outline" className="shrink-0">
          Repos {formatRest(exercise.restSeconds)}
        </Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Série</TableHead>
            <TableHead>Charge</TableHead>
            <TableHead>Répétitions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercise.sets.map((set, i) => (
            <TableRow key={i}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="tabular-nums">{formatLoad(set.kg)}</TableCell>
              <TableCell className="tabular-nums">{set.reps}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RoutineDetail({ routine }: { routine: MockRoutine }) {
  return (
    <>
      <Summary routine={routine} />
      {groupSupersets(routine.exercises).map((group) => {
        const first = group[0];
        if (!first) return null;
        return (
          <Card key={group.map((e) => e.slug).join("+")}>
            {first.superset && (
              <CardHeader>
                <CardTitle>Superset {first.superset}</CardTitle>
                <CardDescription>Exercices enchaînés, repos après le dernier</CardDescription>
              </CardHeader>
            )}
            <CardContent className="flex flex-col gap-6">
              {group.map((e, i) => (
                <div key={e.slug} className="flex flex-col gap-6">
                  {i > 0 && <Separator />}
                  <ExerciseBlock exercise={e} />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

/** « 80–85 kg » : la plage des charges d'un exercice, ou une seule valeur. */
function loadRange(e: MockRoutineExercise): string {
  const kgs = e.sets.flatMap((s) => (s.kg === null ? [] : [s.kg]));
  if (kgs.length === 0) return "—";
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  if (max === 0) return "Poids du corps";
  return min === max ? formatKg(max) : `${min}–${formatKg(max)}`;
}

function repsRange(e: MockRoutineExercise): string {
  const reps = e.sets.map((s) => s.reps);
  const min = Math.min(...reps);
  const max = Math.max(...reps);
  return min === max ? String(max) : `${min}–${max}`;
}

/** Variante B : le résumé, puis un seul tableau compact, une ligne par exercice. */
export function RoutineDetailCompact({ routine }: { routine: MockRoutine }) {
  return (
    <>
      <Summary routine={routine} />
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Exercice</TableHead>
              <TableHead className="text-right">Séries</TableHead>
              <TableHead className="text-right">Charge</TableHead>
              <TableHead className="text-right">Répétitions</TableHead>
              <TableHead className="pr-4 text-right">Repos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routine.exercises.map((e) => {
              const info = exerciseBySlug(e.slug);
              return (
                <TableRow key={e.slug}>
                  <TableCell className="pl-4">
                    <Link
                      to="/exercises/$slug"
                      params={{ slug: e.slug }}
                      className="font-medium hover:underline"
                    >
                      {info?.name ?? e.slug}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {info?.muscle}
                      {e.superset ? ` · superset ${e.superset}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{e.sets.length}</TableCell>
                  <TableCell className="text-right tabular-nums">{loadRange(e)}</TableCell>
                  <TableCell className="text-right tabular-nums">{repsRange(e)}</TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">
                    {formatRest(e.restSeconds)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
