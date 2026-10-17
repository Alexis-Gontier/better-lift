import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { InlineField } from "@/components/inline-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDelta, formatKg, formatLoad, formatMinutes, formatShortDay } from "@/lib/format";
import { parseCount, parseKg } from "@/lib/parse";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { type DoneExercise, doneVolume, type SessionDetail } from "@/mocks/history";

/**
 * Comment une valeur se modifie (D239) : `inline` au clic (C), `field` en champ (B, après
 * Modifier), `bare` en champ nu qui se lit comme du texte (A).
 */
type EditMode = "inline" | "field" | "bare";
export type SessionEdit = { mode: EditMode; onChange: (next: SessionDetail) => void };

const bareField =
  "border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent";

/** Une valeur de séance : du texte en lecture, un champ ou un clic en modification. */
function Value({
  mode,
  label,
  value,
  display,
  onCommit,
  multiline = false,
  placeholder,
  className,
}: {
  mode?: EditMode;
  label: string;
  value: string;
  display: React.ReactNode;
  onCommit: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  if (!mode) return display;
  if (mode === "inline")
    return (
      <InlineField
        label={label}
        type={multiline ? "text" : "number"}
        multiline={multiline}
        placeholder={placeholder}
        value={value}
        display={display}
        className={multiline ? undefined : "tabular-nums"}
        inputClassName={className}
        onCommit={onCommit}
      />
    );
  const field = mode === "bare" ? bareField : undefined;
  return multiline ? (
    <Textarea
      aria-label={label}
      placeholder={placeholder}
      value={value}
      className={field}
      onChange={(e) => onCommit(e.target.value)}
    />
  ) : (
    <Input
      type="number"
      inputMode="decimal"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      className={cn("h-8", className, field)}
      onChange={(e) => onCommit(e.target.value)}
    />
  );
}

function Summary({
  detail,
  previous,
  edit,
}: {
  detail: SessionDetail;
  previous?: SessionDetail;
  edit?: SessionEdit;
}) {
  const { session } = detail;
  const volume = doneVolume(detail);
  const sets = detail.exercises.reduce((n, e) => n + e.sets.length, 0);
  const figures = [
    { label: "Volume", value: formatKg(volume) },
    { label: "Séries", value: String(sets) },
    { label: "Records", value: String(session.records) },
  ];
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 @xl:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">
              {/* En champ, la valeur perd son unité : l'intitulé la porte. */}
              {edit && edit.mode !== "inline" ? "Durée (min)" : "Durée"}
            </span>
            <span className="font-semibold text-lg tabular-nums">
              <Value
                mode={edit?.mode}
                label="Durée en minutes"
                value={String(session.minutes)}
                display={formatMinutes(session.minutes)}
                className="w-24"
                onCommit={(v) =>
                  edit?.onChange({
                    ...detail,
                    session: { ...session, minutes: parseCount(v, session.minutes) },
                  })
                }
              />
            </span>
          </div>
          {figures.map((i) => (
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
        {edit ? (
          <div className="text-muted-foreground text-sm">
            <Value
              mode={edit.mode}
              multiline
              label="Note de la séance"
              placeholder="Ajouter une note…"
              value={detail.notes ?? ""}
              display={detail.notes}
              onCommit={(notes) => edit.onChange({ ...detail, notes: notes || undefined })}
            />
          </div>
        ) : (
          detail.notes && <p className="text-muted-foreground text-sm">« {detail.notes} »</p>
        )}
      </CardContent>
    </Card>
  );
}

function ExerciseDone({
  exercise,
  mode,
  onChange,
}: {
  exercise: DoneExercise;
  mode?: EditMode;
  onChange: (next: DoneExercise) => void;
}) {
  const info = exerciseBySlug(exercise.slug);
  const setAt = (i: number, patch: Partial<DoneExercise["sets"][number]>) =>
    onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
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
              <TableHead>{mode && mode !== "inline" ? "Charge (kg)" : "Charge"}</TableHead>
              <TableHead>Répétitions</TableHead>
              <TableHead className="text-right">Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercise.sets.map((set, i) => (
              // Clé par position : une clé tirée des valeurs remonterait la ligne à chaque frappe.
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="tabular-nums">
                  <Value
                    mode={mode}
                    label={`Charge de la série ${i + 1}`}
                    placeholder="—"
                    value={set.kg === null ? "" : String(set.kg)}
                    display={formatLoad(set.kg)}
                    className="w-24"
                    onCommit={(v) => setAt(i, { kg: parseKg(v) })}
                  />
                </TableCell>
                <TableCell className="tabular-nums">
                  <Value
                    mode={mode}
                    label={`Répétitions de la série ${i + 1}`}
                    value={String(set.reps)}
                    display={set.reps}
                    className="w-20"
                    onCommit={(v) => setAt(i, { reps: parseCount(v, set.reps) })}
                  />
                </TableCell>
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

/**
 * Une séance relue, comparée à la précédente de la même routine. Avec `edit`, on corrige ses
 * charges, ses répétitions, sa note et sa durée ; ajouter ou retirer un exercice d'une séance
 * passée reste hors périmètre (D239).
 */
export function SessionDetailView({
  detail,
  previous,
  edit,
}: {
  detail: SessionDetail;
  previous?: SessionDetail;
  edit?: SessionEdit;
}) {
  return (
    <>
      <Summary detail={detail} previous={previous} edit={edit} />
      {detail.exercises.map((e, index) => (
        <ExerciseDone
          key={e.slug}
          exercise={e}
          mode={edit?.mode}
          onChange={(next) =>
            edit?.onChange({
              ...detail,
              exercises: detail.exercises.map((x, j) => (j === index ? next : x)),
            })
          }
        />
      ))}
    </>
  );
}
