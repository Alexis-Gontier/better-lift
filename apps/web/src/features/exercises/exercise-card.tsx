import Link from "next/link";

import { Badge } from "@better-lift/ui/components/badge";
import { Card, CardContent, CardTitle } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { type ExerciseSummary } from "@better-lift/validators";

import { ExerciseMedia } from "./exercise-media";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";

/**
 * `Link` **autour** de la carte, et non un lien posé sur le titre : dans une
 * grille qu'on parcourt du regard, la cible est la vignette autant que le nom.
 * `Card` rend un `<div>`, qu'un `<a>` a le droit de contenir — c'est l'inverse
 * qui serait invalide, et rien d'interactif ne vit à l'intérieur.
 */
export function ExerciseCard({ exercise }: { exercise: ExerciseSummary }) {
  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card size="sm" className="h-full transition-colors group-hover:bg-accent/50">
        <CardContent className="flex items-center gap-3">
          <ExerciseMedia
            url={exercise.thumbnailUrl}
            name={exercise.name}
            className="size-14 shrink-0 rounded-lg"
          />

          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{exercise.name}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
            </p>
          </div>

          {/*
            La provenance est dite sur la carte, pas seulement derrière le
            filtre : sans elle, un exercice personnalisé et son homonyme du
            catalogue seraient indiscernables dans une liste mêlée.
          */}
          {exercise.isCustom && (
            <Badge variant="secondary" className="shrink-0">
              Perso
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Squelette aux dimensions exactes de la vraie carte : la grille ne saute pas au chargement. */
export function ExerciseCardSkeleton() {
  return (
    <Card size="sm" aria-hidden>
      <CardContent className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-lg" />
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}
