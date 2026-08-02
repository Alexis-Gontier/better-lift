import { Skeleton } from "@better-lift/ui/components/skeleton";

/**
 * Squelette de la zone authentifiée. Il s'affiche **dans** le layout `(app)`,
 * donc l'en-tête et la navigation restent visibles pendant le chargement : le
 * cadre ne clignote pas, seul le contenu se remplit.
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

      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
