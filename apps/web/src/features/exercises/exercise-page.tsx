import {
  avecCharge,
  CIBLES,
  type ExerciceDetail,
  type ExerciceResume,
  formatJour,
  type HistoriqueExercice,
  type PeriodeExercice,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TIME_ZONE } from "@/lib/time-zone";
import { BestSetsTable } from "./best-sets-table";
import { ExerciseAnalysis } from "./exercise-analysis";
import { ExerciseAnimation } from "./exercise-animation";
import { ExerciseCard } from "./exercise-grid";

/**
 * La fiche d'un exercice, dans le panneau de droite (D206) : en-tête, analyse (si pratiqué),
 * consignes, variantes. `undefined` : en chargement ; `null` : en échec.
 */
export function ExercisePage({
  exercise,
  history,
  variants,
  period,
  onPeriod,
  onClose,
}: {
  exercise: ExerciceDetail;
  history: HistoriqueExercice | null | undefined;
  variants: ExerciceResume[] | null | undefined;
  period: PeriodeExercice;
  onPeriod: (period: PeriodeExercice) => void;
  onClose: () => void;
}) {
  const last = history?.[0];
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start gap-6">
        <ExerciseAnimation
          key={exercise.gif ?? exercise.slug}
          gif={exercise.gif}
          name={exercise.nom}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight">{exercise.nom}</h1>
              <p className="text-sm text-muted-foreground">{exercise.nomAnglais}</p>
            </div>
            {/* Fermer rend la grille en pleine largeur, filtres gardés (D206). */}
            <Button variant="outline" size="icon-sm" onClick={onClose} aria-label="Fermer la fiche">
              <X aria-hidden="true" />
            </Button>
          </div>
          {/* Les muscles et l'équipement : des informations, jamais l'orange de l'action. */}
          <div className="flex flex-wrap gap-2">
            <MuscleBadge slug={exercise.slug} muscle={exercise.cible} primary />
            {exercise.secondaires.map((m) => (
              <MuscleBadge key={m} slug={exercise.slug} muscle={m} />
            ))}
            <Badge variant="secondary" className="font-medium text-muted-foreground">
              {exercise.equipement}
            </Badge>
          </div>
          {history && last ? (
            <p className="text-sm">
              {history.length} séance{history.length > 1 ? "s" : ""} · la dernière le{" "}
              {formatJour(last.debut, TIME_ZONE)}
            </p>
          ) : null}
        </div>
      </header>

      {history === undefined ? (
        <Skeleton className="h-80 w-full" />
      ) : history === null ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Ton historique sur cet exercice n'a pas pu être chargé.
          </CardContent>
        </Card>
      ) : history.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pas encore pratiqué</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ta progression apparaîtra ici après ta première séance avec cet exercice.
          </CardContent>
        </Card>
      ) : (
        <>
          <ExerciseAnalysis history={history} period={period} onPeriod={onPeriod} />
          {avecCharge(history) ? <BestSetsTable history={history} /> : null}
        </>
      )}

      {exercise.instructions.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Exécution</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex list-decimal flex-col gap-2 pl-5 leading-relaxed marker:font-bold">
              {exercise.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {variants?.length ? (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg">Variantes</h2>
            <p className="text-sm text-muted-foreground">
              Même muscle ciblé, avec un autre équipement.
            </p>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
            {variants.map((v) => (
              <li key={v.slug} className="flex">
                <ExerciseCard exercise={v} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

const isTarget = (m: string): m is (typeof CIBLES)[number] =>
  (CIBLES as readonly string[]).includes(m);

/**
 * Un muscle de la fiche (D209). S'il est l'un des 19 muscles ciblés du filtre, c'est un lien :
 * la grille de gauche se filtre sur lui, la fiche reste ouverte ; la recherche et l'équipement
 * sautent, sans quoi « Pectoraux » pourrait ne rien montrer. Les autres restent du texte.
 */
function MuscleBadge({
  slug,
  muscle,
  primary = false,
}: {
  slug: string;
  muscle: string;
  primary?: boolean;
}) {
  const look = primary ? "outline" : "secondary";
  const tint = primary ? undefined : "bg-muted font-medium";
  if (!isTarget(muscle)) {
    return (
      <Badge variant={look} className={tint}>
        {muscle}
      </Badge>
    );
  }
  return (
    <Badge variant={look} className={cn(tint, "underline-offset-2 hover:underline")} asChild>
      <Link
        to="/exercises/$slug"
        params={{ slug }}
        search={(s) => ({ ...s, target: muscle, q: undefined, equipment: undefined })}
        title={`Voir les exercices : ${muscle}`}
      >
        {muscle}
      </Link>
    </Badge>
  );
}
