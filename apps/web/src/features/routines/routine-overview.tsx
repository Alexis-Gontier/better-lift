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
import { formatDaysAgo, formatKg, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { bodyMuscles, daysSince, estimateMinutes, plannedVolume } from "@/mocks/routine-stats";
import { FOLDERS, type MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";
import type { Draft } from "./routine-draft";
import { filled } from "./routine-editor";

/** Les chiffres de la routine, une mini-carte chacun (D255) : ils suivent la saisie. */
function Figures({ routine }: { routine: MockRoutine }) {
  const sets = routine.exercises.reduce((n, e) => n + e.sets.length, 0);
  const figures = [
    { label: "Durée", value: `~${formatMinutes(estimateMinutes(routine.exercises))}` },
    { label: "Séries", value: String(sets) },
    { label: "Volume prévu", value: formatKg(plannedVolume(routine.exercises)) },
    { label: "Exercices", value: String(routine.exercises.length) },
  ];
  return (
    <div className="grid gap-2 @[13rem]:grid-cols-2">
      {figures.map((f) => (
        <Card key={f.label} size="sm" className="gap-0.5 px-3">
          <span className="text-muted-foreground text-xs">{f.label}</span>
          <span className="font-semibold tabular-nums">{f.value}</span>
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
    <div className="mx-auto h-36 w-full max-w-44">
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
  draft,
  onChange,
}: {
  /** La routine telle que saisie : les chiffres suivent la saisie. */
  routine: MockRoutine;
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
}) {
  return (
    <>
      <Figures routine={routine} />
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
          <Select
            value={draft.folder}
            onValueChange={(folder) => onChange((d) => ({ ...d, folder }))}
          >
            <SelectTrigger aria-label="Dossier" className={cn("w-full", filled)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FOLDERS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
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
