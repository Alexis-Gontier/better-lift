"use client";

import { useEffect } from "react";

import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

/**
 * Frontière d'erreur de la zone authentifiée. Elle rend dans le layout `(app)`,
 * donc la navigation survit à la panne d'un écran : on peut partir ailleurs
 * sans recharger.
 *
 * Elle ne remplace pas la gestion d'erreur de TanStack Query. Les écrans
 * traitent leurs états chargement / erreur / vide eux-mêmes (règle de
 * `.claude/rules/web.md`) ; ce composant ne rattrape que ce qui a échappé à
 * tout le monde.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Cet écran n’a pas pu s’afficher</EmptyTitle>
          <EmptyDescription>
            Vos données ne sont pas perdues — l’affichage seul a échoué. Réessayer, ou passer par
            une autre section.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>Réessayer</Button>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">Réf. {error.digest}</p>
          ) : null}
        </EmptyContent>
      </Empty>
    </div>
  );
}
