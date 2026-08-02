import { Skeleton } from "@better-lift/ui/components/skeleton";

/**
 * Repli des `<Suspense>` d'authentification.
 *
 * Trois formulaires sur quatre lisent les paramètres d'URL, ce qui impose une
 * frontière `<Suspense>` sous peine d'échec du prérendu. Le repli reprend la
 * forme du formulaire plutôt qu'un « … » : la carte est déjà rendue autour, un
 * contenu de hauteur nulle la ferait grandir d'un coup à l'hydratation.
 *
 * `fields` s'accorde au formulaire qui suit — deux pour la connexion, trois
 * pour l'inscription. Un squelette qui ne réserve pas la bonne place déplace
 * quand même la page, ce qui est le défaut qu'il est censé corriger.
 */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Chargement du formulaire…</span>

      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}

      <Skeleton className="mt-1 h-10 w-full" />
    </div>
  );
}
