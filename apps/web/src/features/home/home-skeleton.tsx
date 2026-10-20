import { Skeleton } from "@/components/ui/skeleton";

/** Le squelette de l'Accueil, à la forme de ses blocs (D176). */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <span className="sr-only">Chargement de l'accueil…</span>
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid @3xl:grid-cols-4 grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid @4xl:grid-cols-3 gap-4">
        <Skeleton className="h-80 rounded-xl @4xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid @4xl:grid-cols-3 gap-4">
        <Skeleton className="h-80 rounded-xl @4xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
