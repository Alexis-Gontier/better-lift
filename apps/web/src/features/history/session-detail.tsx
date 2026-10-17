import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDelta, formatKg, formatLoad, formatMinutes, formatShortDay } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { type DoneExercise, doneVolume, type SessionDetail } from "@/mocks/history";

function Summary({ detail, previous }: { detail: SessionDetail; previous?: SessionDetail }) {
  const { session } = detail;
  const volume = doneVolume(detail);
  const sets = detail.exercises.reduce((n, e) => n + e.sets.length, 0);
  const items = [
    { label: "Durée", value: formatMinutes(session.minutes) },
    { label: "Volume", value: formatKg(volume) },
    { label: "Séries", value: String(sets) },
    { label: "Records", value: String(session.records) },
  ];
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 @xl:grid-cols-4">
          {items.map((i) => (
            <div key={i.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">{i.label}</span>
              <span className="font-semibold text-lg tabular-nums">{i.value}</span>
            </div>
          ))}
        </div>
        {previous ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            Par rapport au {formatShortDay(previous.session.date)} :{" "}
            <span className="font-medium tabular-nums">
              {formatDelta(volume, doneVolume(previous), true)}
            </span>{" "}
            de volume,{" "}
            <span className="font-medium tabular-nums">
              {formatDelta(session.minutes, previous.session.minutes)} min
            </span>
            .
          </p>
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground text-sm">
            Première fois avec cette routine.
          </p>
        )}
        {detail.notes && <p className="text-muted-foreground text-sm">« {detail.notes} »</p>}
      </CardContent>
    </Card>
  );
}

function ExerciseDone({ exercise }: { exercise: DoneExercise }) {
  const info = exerciseBySlug(exercise.slug);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link to="/exercises/$slug" params={{ slug: exercise.slug }} className="hover:underline">
            {info?.name ?? exercise.slug}
          </Link>
        </CardTitle>
        <CardDescription>
          {info?.muscle}
          {exercise.superset ? ` · superset ${exercise.superset}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Série</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Répétitions</TableHead>
              <TableHead className="text-right">Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercise.sets.map((set, i) => (
              <TableRow key={`${i}-${set.kg}-${set.reps}`}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="tabular-nums">{formatLoad(set.kg)}</TableCell>
                <TableCell className="tabular-nums">{set.reps}</TableCell>
                <TableCell className="text-right">
                  {set.record && (
                    <Badge variant="outline">
                      <Trophy data-icon="inline-start" /> Record
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function SessionDetailView({
  detail,
  previous,
}: {
  detail: SessionDetail;
  previous?: SessionDetail;
}) {
  return (
    <>
      <Summary detail={detail} previous={previous} />
      {detail.exercises.map((e) => (
        <ExerciseDone key={e.slug} exercise={e} />
      ))}
    </>
  );
}
