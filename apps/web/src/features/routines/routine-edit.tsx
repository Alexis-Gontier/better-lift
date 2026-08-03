"use client";

import Link from "next/link";

import { ApiClientError, useRoutine } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { RoutineEditor } from "./routine-editor";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Charge la routine avant d'ouvrir l'éditeur.
 *
 * L'éditeur n'est monté qu'une fois la structure connue : la lui passer plus
 * tard obligerait à réinitialiser un `useReducer` déjà en cours, donc à écraser
 * ce que l'utilisateur aurait pu commencer à taper entre-temps.
 */
export function RoutineEdit({ id }: { id: string }) {
  const locale = useProfileLocale();
  const routine = useRoutine(apiClient, id, locale);

  if (routine.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (routine.isError) {
    const missing = routine.error instanceof ApiClientError && routine.error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>
          {missing ? "Cette routine n’existe plus." : "Routine indisponible."}
        </AlertTitle>
        <AlertDescription>
          {missing ? "Elle a pu être supprimée depuis." : routine.error.message}
        </AlertDescription>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/routines">Retour aux routines</Link>
        </Button>
      </Alert>
    );
  }

  return <RoutineEditor routine={routine.data} />;
}
