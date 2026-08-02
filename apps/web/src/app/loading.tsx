import { Spinner } from "@better-lift/ui/components/spinner";

/**
 * Filet de sécurité : cette frontière Suspense couvre tout ce qui n'a pas son
 * propre `loading.tsx` plus bas. Elle s'affiche pendant le chargement du layout
 * d'un groupe de routes — donc avant que la coquille de la section soit connue,
 * d'où un contenu volontairement neutre plutôt qu'un squelette qui promettrait
 * une mise en page.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
