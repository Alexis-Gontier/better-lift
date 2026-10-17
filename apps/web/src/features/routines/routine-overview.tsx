import { BodyMap } from "@/components/body-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDaysAgo, formatDelta, formatKg, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { bodyMuscles, daysSince, estimateMinutes, plannedVolume } from "@/mocks/routine-stats";
import { useFolders } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";
import type { Draft } from "./routine-draft";
import { filled } from "./routine-editor";

const NO_FOLDER = "__sans-dossier";

/** Les chiffres de la routine, une mini-carte chacun (D255) : ils suivent la saisie. */
function Figures({ routine, saved }: { routine: MockRoutine; saved?: MockRoutine }) {
  const sets = (r: MockRoutine) => r.exercises.reduce((n, e) => n + e.sets.length, 0);
  // Chaque chiffre garde sa valeur enregistrée : l'écart se lit tant que rien n'est enregistré.
  const figures = [
    {
      label: "Durée",
      value: `~${formatMinutes(estimateMinutes(routine.exercises))}`,
      now: estimateMinutes(routine.exercises),
      was: saved && estimateMinutes(saved.exercises),
      unit: " min",
    },
    {
      label: "Séries",
      value: String(sets(routine)),
      now: sets(routine),
      was: saved && sets(saved),
    },
    {
      label: "Volume prévu",
      value: formatKg(plannedVolume(routine.exercises)),
      now: plannedVolume(routine.exercises),
      was: saved && plannedVolume(saved.exercises),
      unit: " kg",
    },
    {
      label: "Exercices",
      value: String(routine.exercises.length),
      now: routine.exercises.length,
      was: saved?.exercises.length,
    },
  ];
  return (
    <div className="grid gap-2 @[13rem]:grid-cols-2">
      {figures.map((f) => (
        <Card key={f.label} size="sm" className="gap-0.5 px-3">
          <span className="text-muted-foreground text-xs">{f.label}</span>
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-semibold tabular-nums">{f.value}</span>
            {f.was !== undefined && Math.round(f.was) !== Math.round(f.now) && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatDelta(f.now, f.was)}
                {f.unit}
              </span>
            )}
          </span>
        </Card>
      ))}
      <Card
        size="sm"
        className="flex-row items-baseline justify-between gap-2 px-3 @[13rem]:col-span-2"
      >
        <span className="text-muted-foreground text-xs">Dernière fois</span>
        <span className="font-medium text-sm">
          {formatDaysAgo(routine.lastDone ? daysSince(routine.lastDone, TODAY) : null)}
        </span>
      </Card>
    </div>
  );
}

/** Ce que la routine fait travailler : la silhouette seule, en petit (D255). */
function Muscles({ routine }: { routine: MockRoutine }) {
  const { primary, secondary } = bodyMuscles(routine.exercises, exerciseBySlug);
  if (primary.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Ajoutez un exercice pour voir les muscles travaillés.
      </p>
    );
  return (
    // Hauteur explicite : la silhouette prendrait sinon toute la colonne.
    <div className="mx-auto h-24 w-full max-w-32">
      <BodyMap primary={primary} secondary={secondary} />
    </div>
  );
}

/**
 * La colonne de droite de l'éditeur (D253, D254), une carte par sujet : les chiffres, les
 * muscles travaillés, puis les réglages — dossier et notes —, qui ne pèsent plus en tête.
 */
export function RoutineOverview({
  routine,
  saved,
  draft,
  onChange,
}: {
  /** La routine telle que saisie : les chiffres suivent la saisie. */
  routine: MockRoutine;
  /** La version enregistrée : chaque chiffre montre son écart avec elle. */
  saved?: MockRoutine;
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
}) {
  const folders = useFolders();
  return (
    <>
      <Figures routine={routine} saved={saved} />
      <Card size="sm">
        <CardHeader>
          <CardTitle>Muscles travaillés</CardTitle>
        </CardHeader>
        <CardContent>
          <Muscles routine={routine} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Réglages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Radix refuse une valeur vide : « Sans dossier » passe par une clé. */}
          <Select
            value={folders.includes(draft.folder) ? draft.folder : NO_FOLDER}
            onValueChange={(v) => onChange((d) => ({ ...d, folder: v === NO_FOLDER ? "" : v }))}
          >
            <SelectTrigger aria-label="Dossier" className={cn("w-full", filled)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {folders.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
                <SelectItem value={NO_FOLDER}>Sans dossier</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Textarea
            aria-label="Notes de la routine"
            placeholder="Notes : échauffement, consignes…"
            className={cn("min-h-20", filled)}
            value={draft.notes}
            onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value }))}
          />
        </CardContent>
      </Card>
    </>
  );
}
