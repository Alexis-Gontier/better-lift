"use client";

import { useStatsMuscleDistribution } from "@better-lift/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { type StatsRange } from "@better-lift/validators";

import { RANGE_LABELS } from "./format";
import { BODY_PART_LABELS } from "@/features/exercises/labels";
import { apiClient } from "@/lib/api";

function MuscleDistributionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition musculaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-2/5" />
      </CardContent>
    </Card>
  );
}

/**
 * Séries par partie du corps, en barres horizontales triées (doc 05).
 *
 * Pas de radar : plus joli, nettement moins lisible pour comparer des valeurs.
 * On privilégie la lecture.
 *
 * Les barres sont dessinées en CSS et non avec Recharts. Un `BarChart`
 * horizontal apporterait ici un axe, une grille et une infobulle pour rendre ce
 * qu'une largeur en pourcentage dit déjà — et il faudrait de toute façon
 * réécrire les étiquettes à côté. La valeur est lisible directement, sans
 * survol.
 */
export function MuscleDistribution({ range }: { range: StatsRange }) {
  const distribution = useStatsMuscleDistribution(apiClient, range);

  if (distribution.isPending) {
    return <MuscleDistributionSkeleton />;
  }

  if (distribution.isError || !distribution.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition musculaire</CardTitle>
          <CardDescription>La répartition n’a pas pu être chargée.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { data, totalSets } = distribution.data;
  // Le maximum sert d'échelle : rapporter au total écraserait toutes les barres
  // dès qu'il y a plus de trois parties du corps.
  const max = data[0]?.setCount ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition musculaire</CardTitle>
        <CardDescription>Séries validées sur {RANGE_LABELS[range].toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune série enregistrée sur la période.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.map(({ bodyPart, setCount }) => {
              const share = totalSets === 0 ? 0 : Math.round((setCount / totalSets) * 100);

              return (
                <li key={bodyPart} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{BODY_PART_LABELS[bodyPart]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {setCount} <span className="text-xs">({share} %)</span>
                    </span>
                  </div>
                  {/*
                    `role="img"` avec un `aria-label` complet plutôt qu'une
                    barre de progression : ce n'est pas une progression vers un
                    objectif, et le pourcentage est déjà écrit à côté. Le rôle
                    évite qu'un lecteur d'écran annonce un `div` vide.
                  */}
                  <div
                    role="img"
                    aria-label={`${BODY_PART_LABELS[bodyPart]} : ${setCount} séries, ${share} % du total`}
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-foreground/70"
                      style={{ width: `${max === 0 ? 0 : (setCount / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
