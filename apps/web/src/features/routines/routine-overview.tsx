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
import {
  bodyMuscles,
  daysSince,
  estimateMinutes,
  plannedVolume,
  setsByMuscle,
} from "@/mocks/routine-stats";
import { FOLDERS, type MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";
import type { Draft } from "./routine-draft";
import { filled } from "./routine-editor";

/** Les chiffres de la routine, en tuiles (D253) : ils suivent la saisie. */
function Figures({ routine }: { routine: MockRoutine }) {
  const sets = routine.exercises.reduce((n, e) => n + e.sets.length, 0);
  const figures = [
    { label: "Durée estimée", value: `~${formatMinutes(estimateMinutes(routine.exercises))}` },
    { label: "Séries", value: String(sets) },
    { label: "Volume prévu", value: formatKg(plannedVolume(routine.exercises)) },
    { label: "Exercices", value: String(routine.exercises.length) },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {figures.map((f) => (
        <div key={f.label} className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">{f.label}</span>
          <span className="font-semibold text-lg tabular-nums">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Ce que la routine fait travailler : la silhouette, puis les séries par muscle en barres. */
function Muscles({ routine }: { routine: MockRoutine }) {
  const { primary, secondary } = bodyMuscles(routine.exercises, exerciseBySlug);
  const rows = setsByMuscle(routine.exercises, exerciseBySlug);
  const max = Math.max(1, ...rows.map((r) => r.sets));
  if (rows.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Ajoutez un exercice pour voir les muscles travaillés.
      </p>
    );
  return (
    <div className="flex flex-col gap-4">
      {/* Hauteur explicite : la silhouette prendrait sinon toute la colonne. */}
      <div className="mx-auto h-44 w-full max-w-52">
        <BodyMap primary={primary} secondary={secondary} />
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li
            key={r.muscle}
            className="grid grid-cols-[6.5rem_1fr_1.5rem] items-center gap-2 text-sm"
          >
            <span className="truncate">{r.muscle}</span>
            <span className="h-1.5 rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-foreground/70"
                style={{ width: `${(r.sets / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-muted-foreground tabular-nums">{r.sets}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * La colonne de droite de l'éditeur (D253) : ce que la routine représente — chiffres, muscles —
 * puis ses réglages, dossier et notes, qui ne pèsent plus en tête de l'éditeur.
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
      <Card size="sm">
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Figures routine={routine} />
          <Muscles routine={routine} />
          <p className="text-muted-foreground text-xs">
            Dernière fois :{" "}
            {formatDaysAgo(
              routine.lastDone ? daysSince(routine.lastDone, TODAY) : null,
            ).toLowerCase()}
          </p>
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
