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
 * 404 global : URL qui ne correspond à aucune route, et `notFound()` appelé
 * depuis un segment sans `not-found.tsx` plus proche.
 *
 * Le lien de repli va vers `/`, pas vers `/dashboard` : cette page est servie
 * aussi bien à un visiteur anonyme qu'à un connecté, et `proxy.ts` renverrait
 * le premier vers `/login`. La racine est hors de son `matcher`, donc atteignable
 * dans les deux cas.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Page introuvable</EmptyTitle>
          <EmptyDescription>
            Cette adresse ne mène nulle part. Elle a peut-être changé, ou la ressource a été
            supprimée.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Retour à l’accueil</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
