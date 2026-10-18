import { groupeDe, LIBELLE_RECORD, type SeanceDetail } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Info, ListChecks, MoreHorizontal, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { DetailColumnsSkeleton } from "@/components/detail-columns";
import { ExerciseThumb } from "@/components/exercise-media";
import { ExerciseQuickView } from "@/components/exercise-quick-view";
import { DetailEmpty, DetailHeader } from "@/components/list-detail";
import { SetBadge } from "@/components/set-badge";
import { useCrumbLabel } from "@/components/shell/crumb-label";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ErreurApi } from "@/lib/api";
import { formatDay, formatKg, formatLoad, formatMinutes, formatShortDay } from "@/lib/format";
import { jourCivil } from "@/lib/locale";
import { setLabels, setTone } from "@/lib/series";
import { cn } from "@/lib/utils";
import { seanceQuery, useSupprimerSeance } from "./queries";

/** Le jour d'une séance, en toutes lettres, dans le fuseau du web. */
const jourDe = (iso: string) => formatDay(jourCivil(iso));
const minutesDe = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

/** Ce qu'on retient d'une séance pour la supprimer : de quoi la nommer. */
export type SeanceASupprimer = { id: string; nom: string; debut: string };

/**
 * Supprimer une séance, après confirmation : du menu ⋯ comme du clic droit dans la liste. Ouverte,
 * elle se referme. Le toast permet d'annuler (D302).
 */
export function DeleteSessionDialog({
  session,
  onOpenChange,
}: {
  /** La séance à supprimer ; `null` : fenêtre fermée. */
  session: SeanceASupprimer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { id: openId } = useParams({ strict: false });
  const supprimer = useSupprimerSeance();
  function remove() {
    if (!session) return;
    if (session.id === openId) navigate({ to: "/history", search: true });
    supprimer(session.id, "Séance supprimée");
  }
  return (
    <AlertDialog open={session !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
          <AlertDialogDescription>
            {session && `${session.nom}, ${jourDe(session.debut)}. `}Ses séries et les records
            qu'elle portait disparaîtront.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Le menu ⋯ de la séance : la routine d'origine, puis Supprimer. */
function SessionMenu({ seance }: { seance: SeanceDetail }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Actions de la séance">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {seance.routineId && (
            <DropdownMenuItem
              onSelect={() =>
                seance.routineId &&
                navigate({ to: "/routines/$id", params: { id: seance.routineId } })
              }
            >
              <ListChecks /> Voir la routine
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteSessionDialog session={confirming ? seance : null} onOpenChange={setConfirming} />
    </>
  );
}

/** Les chiffres de la séance en bandeau, en tête (D265). */
function SessionSummary({ seance }: { seance: SeanceDetail }) {
  const figures = [
    { label: "Durée", value: formatMinutes(minutesDe(seance)) },
    { label: "Volume", value: formatKg(seance.volumeKg) },
    { label: "Séries faites", value: String(seance.seriesFaites) },
    { label: "Records", value: String(seance.nbRecords) },
  ];
  return (
    <Card size="sm">
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <span className="font-semibold text-lg tabular-nums">{f.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Mêmes colonnes que l'éditeur de routine (D246) ; « Précédent » s'efface dans une carte étroite.
const SET_GRID =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 @[30rem]/sets:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]";
const PREVIOUS_COL = "hidden @[30rem]/sets:block";

type ExerciceFait = SeanceDetail["exercices"][number];

/**
 * Un exercice fait, en lecture (D263, D294) : sa tête, puis ses séries face à sa dernière
 * occurrence antérieure, position par position, toutes les séries comprises (D123).
 */
function DoneExerciseCard({
  exercise,
  letter,
  onView,
}: {
  exercise: ExerciceFait;
  letter: string | null;
  onView: () => void;
}) {
  const labels = setLabels(exercise.series);
  const records = exercise.series.filter((s) => s.records.length > 0).length;
  return (
    <Card size="sm" className="@container/ex gap-0 py-0">
      <div className="flex items-center gap-3 p-3">
        <ExerciseThumb
          name={exercise.nom}
          src={exercise.image}
          className="hidden @[28rem]/ex:flex"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium" title={exercise.nom}>
            {exercise.nom}
          </span>
          {(letter || exercise.note) && (
            <span className="truncate text-muted-foreground text-xs">
              {[letter && `Superset ${letter}`, exercise.note].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
        {records > 0 && (
          <Badge variant="outline" className="shrink-0">
            <Trophy data-icon="inline-start" />
            {records > 1 ? `${records} records` : "Record"}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={`Actions : ${exercise.nom}`}>
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
        {exercise.series.map((set, i) => {
          const avant = exercise.precedentes[i];
          return (
            // Clé par position : l'ordre des séries est celui de la séance.
            <div
              key={i}
              className={cn(SET_GRID, "px-1 text-sm tabular-nums", !set.faite && "opacity-50")}
            >
              <SetBadge label={labels[i] ?? String(i + 1)} tone={setTone(set.type)} />
              <span className={cn(PREVIOUS_COL, "truncate text-muted-foreground")}>
                {avant ? `${formatLoad(avant.chargeKg)} × ${avant.reps ?? "—"}` : "—"}
              </span>
              <span>{formatLoad(set.chargeKg)}</span>
              <span>{set.reps === null ? "—" : `${set.reps} rép.`}</span>
              {set.records.length > 0 ? (
                <Trophy
                  aria-label={`Record : ${set.records.map((r) => LIBELLE_RECORD[r]).join(", ")}`}
                  className="size-4 justify-self-end"
                />
              ) : !set.faite ? (
                <span className="justify-self-end text-muted-foreground text-xs">Non faite</span>
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

/**
 * La séance ouverte (D235), en lecture : ses chiffres en bandeau, ses exercices, sa note, sur
 * toute la largeur (D265). La corriger n'a pas d'API : elle se relit, elle se supprime (D294).
 */
export function SessionPane({ id }: { id: string }) {
  const force = useEtat();
  const requete = useQuery(seanceQuery(id));
  const [viewing, setViewing] = useState<string | null>(null);
  const seance = requete.data;
  useCrumbLabel(seance ? `${seance.nom} · ${formatShortDay(jourCivil(seance.debut))}` : undefined);

  if (requete.error instanceof ErreurApi && requete.error.statut === 404)
    return (
      <DetailEmpty
        title="Cette séance n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );
  const etat = etatAffiche(force, requete, false);
  if (etat === "erreur")
    return (
      <StateError
        title="La séance n'a pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );
  if (etat === "chargement" || !seance) return <DetailColumnsSkeleton />;
  if (etat === "vide")
    return (
      <DetailEmpty
        title="Cette séance n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  return (
    <>
      <DetailHeader
        title={seance.nom}
        subtitle={jourDe(seance.debut)}
        actions={<SessionMenu seance={seance} />}
      />
      <SessionSummary seance={seance} />
      <div className="flex flex-col gap-3">
        {seance.exercices.map((e, i) => (
          <DoneExerciseCard
            key={`${e.slug}-${i}`}
            exercise={e}
            letter={
              groupeDe(
                seance.exercices.map((x) => ({ supersetGroupe: x.supersetGroupe ?? null })),
                i,
              )?.lettre ?? null
            }
            onView={() => setViewing(e.slug)}
          />
        ))}
      </div>
      {seance.note && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-line text-sm">{seance.note}</CardContent>
        </Card>
      )}
      <ExerciseQuickView slug={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </>
  );
}
