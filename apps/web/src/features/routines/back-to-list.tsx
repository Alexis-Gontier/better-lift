import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

/**
 * Retour à la liste, **seulement quand elle n'est pas déjà à l'écran**.
 *
 * Sous `xl`, les deux volets ne cohabitent pas : le contenu occupe l'écran et
 * ce lien est le seul chemin vers la liste. Au-dessus, la colonne de gauche est
 * là, visible et cliquable — un lien « ← Routines » y désignerait quelque chose
 * qu'on regarde déjà, ce qui est le meilleur moyen de faire douter.
 */
export function BackToList() {
  return (
    <Link
      href="/routines"
      className="inline-flex w-fit items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:hidden"
    >
      <ChevronLeftIcon aria-hidden="true" className="size-4" />
      Routines
    </Link>
  );
}
