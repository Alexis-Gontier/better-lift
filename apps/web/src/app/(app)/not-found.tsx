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
 * 404 de la zone authentifiée : `notFound()` appelé depuis `routines/[id]`,
 * `workouts/[id]`, `exercises/[id]`.
 *
 * Contrairement au 404 racine, elle s'affiche dans le layout `(app)` — la
 * navigation reste là, ce qui est exactement ce dont on a besoin après un
 * identifiant mort.
 *
 * Le libellé ne dit pas « vous n'y avez pas droit » : côté API, la ressource
 * d'autrui renvoie déjà 404 (règle n°8), donc cet écran couvre indistinctement
 * « supprimé » et « pas à vous ». C'est le but, et le texte ne doit pas trahir
 * la différence.
 */
export default function AppNotFound() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Introuvable</EmptyTitle>
          <EmptyDescription>
            Cette ressource n’existe pas ou plus. Elle a peut-être été supprimée depuis le
            téléphone.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
