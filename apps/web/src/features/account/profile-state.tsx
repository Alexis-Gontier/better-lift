"use client";

import { type UseQueryResult } from "@tanstack/react-query";

import { ApiClientError } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { type CurrentUser } from "@better-lift/validators";

/**
 * États de chargement et d'erreur partagés par les écrans de réglages.
 *
 * Les deux formulaires lisent le même `GET /v1/me` et échouent de la même
 * façon. Sans ce garde, chacun affichait son squelette **indéfiniment** en cas
 * d'erreur, faute de distinguer « en attente » de « échoué » — le défaut qui se
 * voit le moins en développement, où la requête aboutit toujours.
 *
 * Le cas le plus probable n'est pas une panne, c'est une session expirée
 * pendant que l'onglet restait ouvert : `proxy.ts` ne vérifie que la
 * **présence** du cookie, jamais sa validité. Un cookie périmé traverse donc la
 * redirection et n'échoue qu'ici, au premier appel à l'API.
 */
export function ProfileError({ query }: { query: UseQueryResult<CurrentUser, Error> }) {
  const expired = query.error instanceof ApiClientError && query.error.status === 401;

  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{expired ? "Session expirée" : "Réglages indisponibles"}</EmptyTitle>
        <EmptyDescription>
          {expired
            ? "Votre session a pris fin pendant que cet onglet était ouvert. Reconnectez-vous pour accéder à vos réglages."
            : "Vos réglages n’ont pas pu être chargés. Réessayez dans un instant."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {expired ? (
          /*
            Un `<a>` et non un `<Link>` : la reconnexion doit repartir d'un
            chargement complet. Une navigation cliente garderait en mémoire le
            cache TanStack de la session morte.
          */
          <Button asChild>
            <a href="/login?next=/settings">Se reconnecter</a>
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

/** Squelette d'un bloc de réglages, aux dimensions de ce qu'il remplace. */
export function SettingsSkeleton({
  blocks = 1,
  height = "h-56",
}: {
  blocks?: number;
  height?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Chargement des réglages…</span>
      {Array.from({ length: blocks }, (_, index) => (
        <Skeleton key={index} className={`${height} w-full rounded-xl`} />
      ))}
    </div>
  );
}
