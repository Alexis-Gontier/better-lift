"use client";

import Link from "next/link";

import { ApiClientError, useExercise } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { ExerciseForm } from "./exercise-form";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Chargement de l'exercice avant édition.
 *
 * Le cas qui mérite l'attention est celui d'un exercice **du catalogue** : le
 * `GET` réussit, puisqu'il est visible de tous, et un formulaire pré-rempli
 * s'afficherait sans problème apparent — pour échouer en 403 à l'enregistrement,
 * après la saisie. On refuse donc tout de suite, avant que quiconque ait tapé
 * quoi que ce soit.
 */
export function ExerciseEdit({ id }: { id: string }) {
  const locale = useProfileLocale();
  const exercise = useExercise(apiClient, id, locale);

  if (exercise.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (exercise.isError) {
    const missing = exercise.error instanceof ApiClientError && exercise.error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>
          {missing ? "Cet exercice n’est plus au catalogue." : "Fiche indisponible."}
        </AlertTitle>
        <AlertDescription>
          {missing ? "Il a pu être archivé depuis." : exercise.error.message}
        </AlertDescription>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/exercises">Retour au catalogue</Link>
        </Button>
      </Alert>
    );
  }

  /*
    Un refus, pas une panne : `Empty` plutôt qu'`Alert`. Rien n'a échoué, la
    demande n'a simplement pas de sens — et l'écran propose la seule chose qui
    en ait une, créer sa propre version.
  */
  if (!exercise.data.isCustom) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Le catalogue commun n’est pas modifiable.</EmptyTitle>
          <EmptyDescription>
            Créer un exercice personnalisé permet d’en faire sa propre version.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/exercises/new">Créer un exercice</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return <ExerciseForm exercise={exercise.data} />;
}
