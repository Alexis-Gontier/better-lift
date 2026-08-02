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
 * Rendue quand un Server Component ou une Server Action appelle
 * `unauthorized()` de `next/navigation` — la réponse porte alors un 401. Le
 * fichier n'est actif que parce que `experimental.authInterrupts` est à `true`
 * dans `next.config.ts`.
 *
 * ## Quand elle sert, et quand elle ne sert pas
 *
 * Pas pour un visiteur anonyme sur `(app)/*` : `proxy.ts` l'intercepte en amont
 * et le redirige vers `/login?next=…`, ce qui est un bien meilleur parcours
 * qu'un cul-de-sac à 401.
 *
 * Elle sert au cas que le proxy ne peut pas voir : un cookie **présent mais
 * invalide ou expiré**. Le proxy ne vérifie que la présence du cookie (doc 05),
 * donc c'est le premier appel serveur vers l'API qui découvre le 401.
 */
export default function Unauthorized() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Session expirée</EmptyTitle>
          <EmptyDescription>
            Votre session n’est plus valide. Se reconnecter rétablit l’accès.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
