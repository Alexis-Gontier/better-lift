import type { Brouillon, SeanceResume } from "@better-lift/shared";
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
import { joursDepuis } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { InfoExercice } from "./infos";
import { filled } from "./routine-editor";
import { minutesEstimees, musclesRoutine, seriesPrevues, statsRoutine, volumePrevu } from "./stats";

const NO_FOLDER = "__sans-dossier";
/** La fenêtre des stats d'une routine (D280). */
const JOURS_STATS = 91;

const nbSeries = (b: Brouillon) => b.exercices.reduce((n, e) => n + e.series.length, 0);

/**
 * La routine en bref (D265), une ligne par chiffre : ils suivent la saisie et montrent leur
 * écart avec la version enregistrée. Le volume prévu n'apparaît qu'avec des charges notées ;
 * « Dernière fois » ouvre la séance.
 */
function Summary({
  draft,
  saved,
  derniere,
}: {
  draft: Brouillon;
  saved?: Brouillon;
  derniere?: SeanceResume;
}) {
  const warmups = draft.exercices.reduce(
    (n, e) => n + e.series.filter((s) => s.type === "ECHAUFFEMENT").length,
    0,
  );
  const delta = (now: number, was: number | undefined, unit = "") =>
    was !== undefined && Math.round(was) !== Math.round(now)
      ? `${formatDelta(now, was)}${unit}`
      : undefined;
  const minutes = minutesEstimees(draft);
  const volume = volumePrevu(draft);
  const rows: SummaryRow[] = [
    {
      label: "Durée estimée",
      value: `~${formatMinutes(minutes)}`,
      delta: delta(minutes, saved && minutesEstimees(saved), " min"),
    },
    {
      label: "Exercices",
      value: String(draft.exercices.length),
      delta: delta(draft.exercices.length, saved?.exercices.length),
    },
    {
      label: "Séries",
      value: String(nbSeries(draft)),
      delta: delta(nbSeries(draft), saved && nbSeries(saved)),
      hint: warmups > 0 ? `dont ${plural(warmups, "échauffement")}` : undefined,
    },
    // Sans charge cible notée, pas de ligne.
    ...(volume > 0
      ? [
          {
            label: "Volume prévu",
            value: formatKg(volume),
            delta: delta(volume, saved && volumePrevu(saved), " kg"),
          },
        ]
      : []),
    {
      label: "Dernière fois",
      value: derniere ? (
        <Link to="/history/$id" params={{ id: derniere.id }} className="hover:underline">
          {formatDaysAgo(joursDepuis(derniere.debut))}
        </Link>
      ) : (
        formatDaysAgo(null)
      ),
    },
  ];
  return <SummaryCard title="En bref" rows={rows} />;
}

/**
 * La routine dans le temps, en bref (D280, D311) : séances, volume moyen et sa tendance, durée,
 * records et réalisation sur trois mois.
 */
function RoutineStats({ saved, seances }: { saved: Brouillon; seances: SeanceResume[] }) {
  const depuis = new Date(Date.now() - JOURS_STATS * 86_400_000).toISOString();
  const s = statsRoutine(seriesPrevues(saved), seances, depuis);
  if (!s) return null;
  const rows: SummaryRow[] = [
    { label: "Séances sur 3 mois", value: String(s.nb) },
    {
      label: "Volume moyen",
      value: formatKg(Math.round(s.volumeMoyen)),
      delta:
        s.tendanceVolume === null
          ? undefined
          : `${s.tendanceVolume > 0 ? "+" : s.tendanceVolume < 0 ? "−" : "±"}${Math.abs(Math.round(s.tendanceVolume))} %`,
    },
    { label: "Durée moyenne", value: formatMinutes(Math.round(s.dureeMoyenneMin)) },
    { label: "Records battus", value: String(s.records) },
    { label: "Réalisation", value: `${Math.round(s.realisation * 100)} %` },
  ];
  return <SummaryCard title="Stats" rows={rows} />;
}

/** Ce que la routine fait travailler : la silhouette seule, en petit (D255). */
function Muscles({ draft, infos }: { draft: Brouillon; infos: ReadonlyMap<string, InfoExercice> }) {
  const { primary, secondary } = musclesRoutine(
    draft.exercices.flatMap((e) => {
      const info = infos.get(e.slug);
      return info ? [info] : [];
    }),
  );
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
 * La colonne de droite de l'éditeur (D253, D254), une carte par sujet : les chiffres, les stats,
 * les muscles travaillés, puis les réglages — dossier et note —, qui ne pèsent plus en tête.
 */
export function RoutineOverview({
  draft,
  saved,
  seances,
  infos,
  dossiers,
  onChange,
}: {
  /** La routine telle que saisie : les chiffres suivent la saisie. */
  draft: Brouillon;
  /** La version enregistrée : chaque chiffre montre son écart avec elle ; absente à la création. */
  saved?: Brouillon;
  /** Les séances de la routine, la plus récente d'abord (D311) ; absentes à la création. */
  seances?: SeanceResume[];
  infos: ReadonlyMap<string, InfoExercice>;
  dossiers: readonly { id: string; nom: string }[];
  onChange: (update: (d: Brouillon) => Brouillon) => void;
}) {
  const dossier = draft.dossierId ?? null;
  return (
    <>
      <Summary draft={draft} saved={saved} derniere={seances?.[0]} />
      {saved && seances && <RoutineStats saved={saved} seances={seances} />}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Muscles travaillés</CardTitle>
        </CardHeader>
        <CardContent>
          <Muscles draft={draft} infos={infos} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Réglages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Radix refuse une valeur vide : « Sans dossier » passe par une clé. */}
          <Select
            value={dossier && dossiers.some((d) => d.id === dossier) ? dossier : NO_FOLDER}
            onValueChange={(v) =>
              onChange((d) => ({ ...d, dossierId: v === NO_FOLDER ? null : v }))
            }
          >
            <SelectTrigger aria-label="Dossier" className={cn("w-full", filled)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {dossiers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nom}
                  </SelectItem>
                ))}
                <SelectItem value={NO_FOLDER}>Sans dossier</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Textarea
            aria-label="Notes de la routine"
            placeholder="Notes : échauffement, consignes…"
            maxLength={1000}
            className={cn("min-h-20", filled)}
            value={draft.note ?? ""}
            onChange={(e) => onChange((d) => ({ ...d, note: e.target.value }))}
          />
        </CardContent>
      </Card>
    </>
  );
}
