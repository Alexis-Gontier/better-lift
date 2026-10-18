import { Info, MoreHorizontal, Trophy } from "lucide-react";
import { useState } from "react";
import { BodyMap } from "@/components/body-map";
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
import { bodyMuscles } from "@/mocks/routine-stats";

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
 * La colonne de droite d'une séance (D263) : ses chiffres en mini-cartes, chacun avec son écart
 * à la séance précédente de la même routine ; la durée se corrige ; puis les muscles et la note.
 */
export function SessionOverview({
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
  const { primary, secondary } = bodyMuscles(draft.exercises, exerciseBySlug);
  return (
    <>
      <div className="grid gap-2 @[13rem]:grid-cols-2">
        <Card size="sm" className="gap-1 px-3">
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
        </Card>
        {figures.map((f) => (
          <Card key={f.label} size="sm" className="gap-0.5 px-3">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-semibold tabular-nums">{f.value}</span>
              {f.delta && (
                <span className="text-muted-foreground text-xs tabular-nums">{f.delta}</span>
              )}
            </span>
          </Card>
        ))}
        <Card
          size="sm"
          className="flex-row items-baseline justify-between gap-2 px-3 @[13rem]:col-span-2"
        >
          <span className="text-muted-foreground text-xs">Précédente</span>
          <span className="font-medium text-sm">
            {previous ? formatShortDay(previous.session.date) : "Première fois"}
          </span>
        </Card>
      </div>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Muscles travaillés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mx-auto h-24 w-full max-w-32">
            <BodyMap primary={primary} secondary={secondary} />
          </div>
        </CardContent>
      </Card>
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
    </>
  );
}
