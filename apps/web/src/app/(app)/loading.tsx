import { Skeleton } from "@better-lift/ui/components/skeleton";

/**
 * Squelette de la zone authentifiée. Il s'affiche **dans** le layout `(app)`,
 * donc la sidebar reste visible pendant le chargement : le cadre ne clignote
 * pas, seul le contenu se remplit.
 *
 * La forme reprend celle que partagent toutes les pages du groupe — un titre,
 * une accroche, puis le contenu. Un squelette qui ne ressemble à rien de ce qui
 * arrive derrière est pire qu'un simple spinner.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <span className="sr-only">Chargement…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/*
        Deux colonnes à partir de `md`, comme les écrans qui viennent derrière :
        la coquille fait désormais 1152 px de large, et trois blocs pleine
        largeur y annonceraient une mise en page que plus aucune page n'a.
      */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
