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
 * Frontière d'erreur des écrans d'authentification. Pas de `loading.tsx` en
 * face : ces pages sont des formulaires clients sans donnée serveur à attendre,
 * un squelette n'y ferait qu'un clignotement.
 *
 * Les erreurs de connexion ou d'inscription — mauvais mot de passe, e-mail déjà
 * pris, API injoignable — sont rendues **dans** les formulaires, au plus près
 * du champ concerné. Sortir du formulaire pour les afficher ferait perdre la
 * saisie. Ce composant ne couvre donc que le plantage de la page elle-même.
 */
export default function AuthError({
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
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Une erreur est survenue</EmptyTitle>
        <EmptyDescription>
          L’écran n’a pas pu s’afficher. Réessayer suffit le plus souvent.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={reset}>Réessayer</Button>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">Réf. {error.digest}</p>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}
