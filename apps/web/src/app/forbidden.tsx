import Link from "next/link";

import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

/**
 * Rendue quand un Server Component ou une Server Action appelle `forbidden()`
 * de `next/navigation` — la réponse porte alors un 403. Comme
 * `unauthorized.tsx`, ce fichier dépend de `experimental.authInterrupts`.
 *
 * ## Pourquoi elle sera rarement atteinte
 *
 * La règle non négociable n°8 est explicite : **une ressource d'autrui renvoie
 * 404, pas 403**. Un 403 confirmerait l'existence de la ressource à quelqu'un
 * qui n'y a pas droit — c'est une fuite. Le chemin normal pour « ça ne vous
 * appartient pas » est donc `notFound()`, pas `forbidden()`.
 *
 * Ce qui reste pour cette page : les refus où l'existence n'est pas un secret —
 * une action réservée à un rôle, un quota, un compte suspendu. Aucun de ces cas
 * n'existe encore ; le fichier est là pour que le premier ne se rabatte pas par
 * défaut sur l'erreur générique.
 */
export default function Forbidden() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Accès refusé</EmptyTitle>
          <EmptyDescription>
            Votre compte n’a pas les droits nécessaires pour cette action.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
