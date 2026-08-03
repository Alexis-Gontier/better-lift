"use client";

import Link from "next/link";

import { ApiClientError, useWorkout } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { WorkoutEditor } from "./workout-editor";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Charge la séance avant d'ouvrir l'éditeur.
 *
 * L'éditeur n'est monté qu'une fois la structure connue : la lui passer plus
 * tard obligerait à réinitialiser un `useReducer` déjà en cours, donc à écraser
 * ce que l'utilisateur aurait pu commencer à corriger entre-temps.
 */
export function WorkoutEdit({ id }: { id: string }) {
  const locale = useProfileLocale();
  const workout = useWorkout(apiClient, id, locale);

  if (workout.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (workout.isError) {
    const missing = workout.error instanceof ApiClientError && workout.error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>{missing ? "Cette séance n’existe plus." : "Séance indisponible."}</AlertTitle>
        <AlertDescription>
          {missing ? "Elle a pu être supprimée depuis." : workout.error.message}
        </AlertDescription>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/workouts">Retour à l’historique</Link>
        </Button>
      </Alert>
    );
  }

  return <WorkoutEditor workout={workout.data} />;
}
