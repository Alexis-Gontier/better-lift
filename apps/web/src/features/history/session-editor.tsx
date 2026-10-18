import { Link } from "@tanstack/react-router";
import { Info, MoreHorizontal, Trophy } from "lucide-react";
import { useState } from "react";
import { ExerciseThumb } from "@/components/exercise-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseQuickView } from "@/features/exercises/exercise-quick-view";
import { setLabels, setTone } from "@/features/routines/routine-draft";
import { filled, SetBadge, SetField } from "@/features/routines/routine-editor";
import { formatDelta, formatKg, formatLoad, formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { type DoneExercise, doneRecords, doneVolume, type SessionDetail } from "@/mocks/history";

// Mêmes colonnes que l'éditeur de routine (D246) ; « Précédent » s'efface dans une carte étroite.
const SET_GRID =
  "grid grid-cols-[2.25rem_8.5rem_8.5rem_minmax(0,1fr)] items-center gap-3 @[30rem]/sets:grid-cols-[2.25rem_6.5rem_8.5rem_8.5rem_minmax(0,1fr)]";
const PREVIOUS_COL = "hidden @[30rem]/sets:block";

/**
 * Un exercice fait, corrigeable sur place (D263) : la tête de la carte de routine, puis ses
 * séries face à la séance précédente de la même routine. On corrige charges et répétitions ;
 * ajouter ou retirer une série d'une séance passée reste hors périmètre (D239).
 */
function DoneExerciseCard({
  exercise,
  previous,
  changed,
  onChange,
  onView,
}: {
  exercise: DoneExercise;
  previous?: DoneExercise;
  changed: boolean;
  onChange: (next: DoneExercise) => void;
  onView: () => void;
}) {
  const info = exerciseBySlug(exercise.slug);
  const name = info?.name ?? exercise.slug;
  const labels = setLabels(exercise.sets);
  const records = exercise.sets.filter((s) => s.record).length;
  const setAt = (i: number, patch: Partial<DoneExercise["sets"][number]>) =>
    onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  return (
    <Card size="sm" className="@container/ex gap-0 py-0">
      <div className="flex items-center gap-3 p-3">
        <ExerciseThumb name={name} className="hidden @[28rem]/ex:flex" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium" title={name}>
              {name}
            </span>
            {changed && (
              <Badge variant="outline" className="shrink-0">
                Modifié
              </Badge>
            )}
          </span>
          <span className="truncate text-muted-foreground text-xs">
            {info?.muscle}
            {exercise.superset ? ` · superset ${exercise.superset}` : ""}
          </span>
        </span>
        {records > 0 && (
          <Badge variant="outline" className="shrink-0">
            <Trophy data-icon="inline-start" />
            {records > 1 ? `${records} records` : "Record"}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={`Actions : ${name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={onView}>
              <Info /> Voir la fiche
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      <div className="@container/sets flex flex-col gap-1.5 p-3">
        <div className={cn(SET_GRID, "px-1 text-muted-foreground text-xs")}>
          <span>Série</span>
          <span className={PREVIOUS_COL}>Précédent</span>
          <span>Charge</span>
          <span>Répétitions</span>
          <span />
        </div>
        {exercise.sets.map((set, i) => {
          const before = previous?.sets[i];
          return (
            // Clé par position : une clé tirée des valeurs remonterait la ligne à chaque frappe.
            <div key={i} className={cn(SET_GRID, "px-1")}>
              <SetBadge label={labels[i] ?? String(i + 1)} tone={setTone(set.type)} />
              <span
                className={cn(PREVIOUS_COL, "truncate text-muted-foreground text-sm tabular-nums")}
              >
                {before ? `${formatLoad(before.kg)} × ${before.reps}` : "—"}
              </span>
              <SetField
                label={`Charge de la série ${i + 1}`}
                unit="kg"
                step={2.5}
                min={0}
                max={1000}
                value={set.kg === null ? "" : String(set.kg)}
                onChange={(v) => setAt(i, { kg: v === "" ? null : Number(v) })}
              />
              <SetField
                label={`Répétitions de la série ${i + 1}`}
                unit="rép."
                step={1}
                min={0}
                max={999}
                value={String(set.reps)}
                onChange={(v) => setAt(i, { reps: v === "" ? 0 : Number(v) })}
              />
              {set.record ? (
                <Trophy aria-label="Record" className="size-4 justify-self-end" />
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Les exercices de la séance, chacun corrigeable ; la fiche s'ouvre en fenêtre. */
export function SessionExercises({
  draft,
  previous,
  changed,
  onChange,
}: {
  draft: SessionDetail;
  previous?: SessionDetail;
  changed: ReadonlySet<number>;
  onChange: (update: (d: SessionDetail) => SessionDetail) => void;
}) {
  const [viewing, setViewing] = useState<string | null>(null);
  return (
    <>
      {draft.exercises.map((e, i) => (
        <DoneExerciseCard
          key={`${e.slug}-${i}`}
          exercise={e}
          previous={previous?.exercises.find((p) => p.slug === e.slug)}
          changed={changed.has(i)}
          onView={() => setViewing(e.slug)}
          onChange={(next) =>
            onChange((d) => ({
              ...d,
              exercises: d.exercises.map((x, j) => (j === i ? next : x)),
            }))
          }
        />
      ))}
      <ExerciseQuickView slug={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </>
  );
}

/**
 * Les chiffres de la séance en bandeau, en tête (D265) : la durée se corrige ; volume et séries
 * montrent leur écart à la séance précédente de la même routine, dont la date ouvre le relevé.
 * Une séance n'a pas de colonne de droite : le tableau des séries prend toute la largeur.
 */
export function SessionSummary({
  draft,
  previous,
  onChange,
}: {
  draft: SessionDetail;
  previous?: SessionDetail;
  onChange: (update: (d: SessionDetail) => SessionDetail) => void;
}) {
  const volume = doneVolume(draft);
  const sets = (d: SessionDetail) => d.exercises.reduce((n, e) => n + e.sets.length, 0);
  const figures = [
    {
      label: "Volume",
      value: formatKg(volume),
      delta: previous && formatDelta(volume, doneVolume(previous), true),
    },
    {
      label: "Séries",
      value: String(sets(draft)),
      delta: previous && formatDelta(sets(draft), sets(previous)),
    },
    { label: "Records", value: String(doneRecords(draft)) },
  ];
  return (
    <Card size="sm" className="@container/sum">
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 @xl/sum:grid-cols-[auto_repeat(3,minmax(0,1fr))_auto] @xl/sum:items-center">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Durée</span>
          <SetField
            label="Durée en minutes"
            unit="min"
            step={5}
            min={1}
            max={600}
            value={String(draft.session.minutes)}
            onChange={(v) =>
              onChange((d) => ({
                ...d,
                session: { ...d.session, minutes: v === "" ? 0 : Number(v) },
              }))
            }
          />
        </div>
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-semibold text-lg tabular-nums">{f.value}</span>
              {f.delta && (
                <span className="text-muted-foreground text-xs tabular-nums">{f.delta}</span>
              )}
            </span>
          </div>
        ))}
        <div className="col-span-2 flex flex-col gap-0.5 @xl/sum:col-span-1 @xl/sum:items-end">
          <span className="text-muted-foreground text-xs">Comparée à</span>
          {previous ? (
            <Link
              to="/history/$id"
              params={{ id: previous.session.id }}
              search
              className="font-medium text-sm hover:underline"
            >
              la séance du {formatShortDay(previous.session.date)}
            </Link>
          ) : (
            <span className="font-medium text-sm">Première fois</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** La note de la séance, sous les exercices : un ressenti, une douleur, un réglage. */
export function SessionNote({
  draft,
  onChange,
}: {
  draft: SessionDetail;
  onChange: (update: (d: SessionDetail) => SessionDetail) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Note</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          aria-label="Note de la séance"
          placeholder="Ressenti, douleur, réglage…"
          className={filled}
          value={draft.notes ?? ""}
          onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value || undefined }))}
        />
      </CardContent>
    </Card>
  );
}
