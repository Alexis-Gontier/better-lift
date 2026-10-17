import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { InlineField } from "@/components/inline-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { parseCount, parseKg } from "@/lib/parse";
import { exerciseBySlug } from "@/mocks/exercises";
import { daysSince, estimateMinutes, groupSupersets, plannedVolume } from "@/mocks/routine-stats";
import type { MockRoutine, MockRoutineExercise, MockSet } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";
import { ExercisePicker, newRoutineExercise } from "./exercise-picker";
import { routineMuscles } from "./routine-card";

function Summary({
  routine,
  onChange,
}: {
  routine: MockRoutine;
  onChange?: (next: MockRoutine) => void;
}) {
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
        {onChange ? (
          <InlineField
            label="Notes de la routine"
            multiline
            placeholder="Ajouter une note…"
            value={routine.notes ?? ""}
            className="text-muted-foreground text-sm"
            onCommit={(notes) => onChange({ ...routine, notes: notes.trim() || undefined })}
          />
        ) : (
          routine.notes && <p className="text-muted-foreground text-sm">{routine.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

type BlockEdit = {
  onChange: (next: MockRoutineExercise) => void;
  onRemove: () => void;
};

/** Le menu ⋯ d'un exercice modifié champ par champ : la structure, pas les valeurs. */
function ExerciseMenu({
  exercise,
  onChange,
  onRemove,
}: BlockEdit & { exercise: MockRoutineExercise }) {
  const last = exercise.sets.at(-1) ?? { kg: null, reps: 10 };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions de l'exercice">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onSelect={() => onChange({ ...exercise, sets: [...exercise.sets, { ...last }] })}
        >
          Ajouter une série
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={exercise.sets.length === 1}
          onSelect={() => onChange({ ...exercise, sets: exercise.sets.slice(0, -1) })}
        >
          Retirer la dernière série
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          Retirer l'exercice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExerciseBlock({ exercise, edit }: { exercise: MockRoutineExercise; edit?: BlockEdit }) {
  const info = exerciseBySlug(exercise.slug);
  const setAt = (i: number, patch: Partial<MockSet>) =>
    edit?.onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
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
        {edit ? (
          <div className="flex shrink-0 items-center gap-1 text-sm">
            <span className="text-muted-foreground">Repos</span>
            <InlineField
              label="Repos en secondes"
              type="number"
              value={String(exercise.restSeconds)}
              display={formatRest(exercise.restSeconds)}
              inputClassName="w-20"
              onCommit={(v) =>
                edit.onChange({ ...exercise, restSeconds: parseCount(v, exercise.restSeconds) })
              }
            />
            <ExerciseMenu exercise={exercise} {...edit} />
          </div>
        ) : (
          <Badge variant="outline" className="shrink-0">
            Repos {formatRest(exercise.restSeconds)}
          </Badge>
        )}
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
              <TableCell className="tabular-nums">
                {edit ? (
                  <InlineField
                    label={`Charge de la série ${i + 1}`}
                    type="number"
                    placeholder="—"
                    value={set.kg === null ? "" : String(set.kg)}
                    display={formatLoad(set.kg)}
                    inputClassName="w-24"
                    onCommit={(v) => setAt(i, { kg: parseKg(v) })}
                  />
                ) : (
                  formatLoad(set.kg)
                )}
              </TableCell>
              <TableCell className="tabular-nums">
                {edit ? (
                  <InlineField
                    label={`Répétitions de la série ${i + 1}`}
                    type="number"
                    value={String(set.reps)}
                    inputClassName="w-20"
                    onCommit={(v) => setAt(i, { reps: parseCount(v, set.reps) })}
                  />
                ) : (
                  set.reps
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Une routine en lecture, une carte par groupe d'exercices (D237). Avec `onChange`, chaque
 * valeur se modifie au clic et la structure passe par le menu ⋯ (variante C, D239).
 */
export function RoutineDetail({
  routine,
  onChange,
}: {
  routine: MockRoutine;
  onChange?: (next: MockRoutine) => void;
}) {
  const [picking, setPicking] = useState(false);
  const editAt = (index: number): BlockEdit | undefined =>
    onChange && {
      onChange: (next) =>
        onChange({
          ...routine,
          exercises: routine.exercises.map((e, j) => (j === index ? next : e)),
        }),
      onRemove: () =>
        onChange({ ...routine, exercises: routine.exercises.filter((_, j) => j !== index) }),
    };
  return (
    <>
      <Summary routine={routine} onChange={onChange} />
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
                  <ExerciseBlock exercise={e} edit={editAt(routine.exercises.indexOf(e))} />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {onChange && (
        <>
          <Button variant="outline" className="self-start" onClick={() => setPicking(true)}>
            <Plus data-icon="inline-start" /> Ajouter un exercice
          </Button>
          <ExercisePicker
            open={picking}
            onOpenChange={setPicking}
            onPick={(slug) =>
              onChange({ ...routine, exercises: [...routine.exercises, newRoutineExercise(slug)] })
            }
          />
        </>
      )}
    </>
  );
}
