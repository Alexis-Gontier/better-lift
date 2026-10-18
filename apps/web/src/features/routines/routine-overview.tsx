import { Link } from "@tanstack/react-router";
import { BodyMap } from "@/components/body-map";
import { SummaryCard, type SummaryRow } from "@/components/summary-card";
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
import { formatDaysAgo, formatDelta, formatKg, formatMinutes, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { bodyMuscles, daysSince, estimateMinutes, plannedVolume } from "@/mocks/routine-stats";
import { useFolders } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";
import type { Draft } from "./routine-draft";
import { filled } from "./routine-editor";

const NO_FOLDER = "__sans-dossier";

/**
 * La routine en bref (D265), une ligne par chiffre : ils suivent la saisie et montrent leur
 * écart avec la version enregistrée. Le volume prévu n'apparaît qu'avec des charges notées ;
 * « Dernière fois » ouvre la séance.
 */
function Summary({ routine, saved }: { routine: MockRoutine; saved?: MockRoutine }) {
  const sessions = useSessions();
  const sets = (r: MockRoutine) => r.exercises.reduce((n, e) => n + e.sets.length, 0);
  const warmups = routine.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.type === "warmup").length,
    0,
  );
  const delta = (now: number, was: number | undefined, unit = "") =>
    was !== undefined && Math.round(was) !== Math.round(now)
      ? `${formatDelta(now, was)}${unit}`
      : undefined;
  const minutes = estimateMinutes(routine.exercises);
  const volume = plannedVolume(routine.exercises);
  const last = sessions.find((s) => s.routine === routine.name && s.date === routine.lastDone);
  const rows: SummaryRow[] = [
    {
      label: "Durée estimée",
      value: `~${formatMinutes(minutes)}`,
      delta: delta(minutes, saved && estimateMinutes(saved.exercises), " min"),
    },
    {
      label: "Exercices",
      value: String(routine.exercises.length),
      delta: delta(routine.exercises.length, saved?.exercises.length),
    },
    {
      label: "Séries",
      value: String(sets(routine)),
      delta: delta(sets(routine), saved && sets(saved)),
      hint: warmups > 0 ? `dont ${plural(warmups, "échauffement")}` : undefined,
    },
    // En base, aucune charge cible n'est notée (D262) : sans charge, pas de ligne.
    ...(volume > 0
      ? [
          {
            label: "Volume prévu",
            value: formatKg(volume),
            delta: delta(volume, saved && plannedVolume(saved.exercises), " kg"),
          },
        ]
      : []),
    {
      label: "Dernière fois",
      value: last ? (
        <Link to="/history/$id" params={{ id: last.id }} className="hover:underline">
          {formatDaysAgo(daysSince(last.date, TODAY))}
        </Link>
      ) : (
        formatDaysAgo(routine.lastDone ? daysSince(routine.lastDone, TODAY) : null)
      ),
    },
  ];
  return <SummaryCard title="En bref" rows={rows} />;
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
      <Summary routine={routine} saved={saved} />
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
