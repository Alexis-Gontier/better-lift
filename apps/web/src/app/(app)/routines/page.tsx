import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

export const metadata: Metadata = { title: "Routines — better-lift" };

/**
 * Volet droit à la racine du segment : rien n'est sélectionné.
 *
 * La liste n'est plus ici — elle vit dans le volet gauche du layout, qui reste
 * monté d'une routine à l'autre. Sous `xl`, ce volet droit est masqué et c'est
 * la liste qui occupe l'écran ; au-dessus, les deux cohabitent et cette page
 * dit quoi faire plutôt que de laisser une moitié d'écran vide.
 */
export default function RoutinesPage() {
  return (
    /*
      `flex-1` et non `h-full` : le volet est une colonne flex, et un
      pourcentage de hauteur y vaut la hauteur du contenu, pas celle de la
      colonne. `Empty` centre déjà horizontalement — c'est le centrage
      **vertical** qui manquait, et qui laissait le texte collé en haut d'un
      volet aux trois quarts vide.
    */
    <Empty className="flex-1 justify-center">
      <EmptyHeader>
        <EmptyTitle>Choisissez une routine.</EmptyTitle>
        <EmptyDescription>
          Une routine est un gabarit de séance : une liste d’exercices et leurs séries cibles. La
          modifier ne touche jamais à l’historique.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/routines/new">Nouvelle routine</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
