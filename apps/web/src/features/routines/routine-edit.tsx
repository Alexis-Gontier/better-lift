"use client";

import Link from "next/link";

import { ApiClientError, useRoutine } from "@better-lift/api-client";

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
      <div className="space-y-3" aria-busy>
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-48 animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  if (routine.isError) {
    const missing = routine.error instanceof ApiClientError && routine.error.status === 404;

    return (
      <div className="space-y-3 rounded-xl bg-card p-5">
        <p className="font-medium">
          {missing ? "Cette routine n’existe plus." : "Routine indisponible."}
        </p>
        <p className="text-sm text-muted-foreground">
          {missing ? "Elle a pu être supprimée depuis." : routine.error.message}
        </p>
        <Link
          href="/routines"
          className="inline-block rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-accent"
        >
          Retour aux routines
        </Link>
      </div>
    );
  }

  return <RoutineEditor routine={routine.data} />;
}
