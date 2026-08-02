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
 * Frontière d'erreur racine. Elle rattrape ce qui échappe aux `error.tsx` des
 * groupes de routes, mais **pas** une erreur du layout racine lui-même : celle-là
 * n'a que `global-error.tsx` au-dessus d'elle.
 *
 * Un `error.tsx` est toujours un composant client — React doit pouvoir le
 * remonter après coup avec `reset()`.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /*
      En production, Next remplace le message par un texte générique et ne
      transmet que `digest` — l'identifiant qui permet de retrouver la trace
      complète côté serveur. C'est donc lui qu'il faut afficher au lecteur, et
      l'objet entier qui n'est utile qu'en développement.
    */
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Une erreur est survenue</EmptyTitle>
          <EmptyDescription>
            L’écran n’a pas pu s’afficher. Réessayer suffit le plus souvent ; si le problème
            persiste, il vient d’ailleurs que de cette page.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>Réessayer</Button>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">Réf. {error.digest}</p>
          ) : null}
        </EmptyContent>
      </Empty>
    </main>
  );
}
