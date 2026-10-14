import {
  avecCharge,
  type ExerciceDetail,
  type ExerciceResume,
  formatJour,
  type HistoriqueExercice,
  type PeriodeExercice,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
 * La fiche d'un exercice, en page entière (D201) : en-tête, analyse (si pratiqué),
 * consignes, variantes. `undefined` : en chargement ; `null` : en échec.
 */
export function ExercisePage({
  exercise,
  history,
  variants,
  period,
  onPeriod,
}: {
  exercise: ExerciceDetail;
  history: HistoriqueExercice | null | undefined;
  variants: ExerciceResume[] | null | undefined;
  period: PeriodeExercice;
  onPeriod: (period: PeriodeExercice) => void;
}) {
  const last = history?.[0];
  return (
    <div className="flex flex-col gap-6">
      <Button variant="link" asChild className="w-fit px-0">
        {/* Retour à la grille telle qu'on l'a laissée : les filtres suivent (D201). */}
        <Link to="/exercises" search={({ period: _p, state: _s, ...s }) => s}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Exercices
        </Link>
      </Button>

      <header className="flex flex-wrap items-start gap-6">
        <div className="w-56 shrink-0">
          <div className="overflow-hidden rounded-base border-2 border-border bg-image-bg shadow-shadow">
            <ExerciseAnimation
              key={exercise.gif ?? exercise.slug}
              gif={exercise.gif}
              name={exercise.nom}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h1 className="text-3xl leading-tight">{exercise.nom}</h1>
            <p className="text-sm text-muted-foreground">{exercise.nomAnglais}</p>
          </div>
          {/* Les muscles et l'équipement : des informations, jamais l'orange de l'action. */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{exercise.cible}</Badge>
            {exercise.secondaires.map((m) => (
              <Badge key={m} variant="secondary" className="bg-muted font-medium">
                {m}
              </Badge>
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
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
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
