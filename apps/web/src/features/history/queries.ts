import type { SeanceFil } from "@better-lift/shared";
import {
  type InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useSuppression } from "@/components/use-suppression";
import { api, lire } from "@/lib/api";
import { exercicesKeys } from "@/lib/exercices";

/**
 * Les séances (D300). `["seances"]` est leur racine. Supprimer une séance touche aussi ce qui en
 * dérive : les routines (dernière séance, stats) et les exercices (faits, historiques).
 */
const seancesKeys = {
  liste: () => ["seances", "liste"] as const,
  detail: (id: string) => ["seances", "detail", id] as const,
};

/** Un appel qui survit au départ de la page (D302) ; `init` remplace celui du client. */
const KEEPALIVE = { init: { keepalive: true, credentials: "include" as const } };

type Page = { seances: SeanceFil[]; total: number; page: number; taille: number };

export const seancesQuery = () =>
  infiniteQueryOptions({
    queryKey: seancesKeys.liste(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<Page> => {
      const res = await lire(
        () => api.seances.$get({ query: { page: String(pageParam), taille: "30" } }),
        "L'historique n'a pas pu être chargé.",
      );
      return res.json();
    },
    getNextPageParam: (p) => (p.page * p.taille < p.total ? p.page + 1 : undefined),
  });

export const seanceQuery = (id: string) =>
  queryOptions({
    queryKey: seancesKeys.detail(id),
    queryFn: async () => {
      const res = await lire(
        () => api.seances[":id"].$get({ param: { id } }),
        "Cette séance n'a pas pu être chargée.",
      );
      return res.json();
    },
  });

/** Supprimer une séance, avec « Annuler » (D302) ; elle sort de toutes les pages chargées. */
export function useSupprimerSeance() {
  const client = useQueryClient();
  return useSuppression<InfiniteData<Page>>({
    cle: seancesKeys.liste(),
    retirer: (d, id) => ({
      ...d,
      pages: d.pages.map((p) => ({
        ...p,
        seances: p.seances.filter((s) => s.id !== id),
        total: p.seances.some((s) => s.id === id) ? p.total - 1 : p.total,
      })),
    }),
    supprimer: async (id) => {
      await lire(
        () => api.seances[":id"].$delete({ param: { id } }, KEEPALIVE),
        "La séance n'a pas pu être supprimée.",
      );
      // Pas d'invalidation du détail : elle referait un GET de la séance partie, soit un 404.
      client.removeQueries({ queryKey: seancesKeys.detail(id) });
    },
    // L'Accueil dérive aussi des séances (D330) : clé littérale, une feature n'en importe pas une autre.
    apres: [["routines"], exercicesKeys.all, ["tableau-de-bord"]],
  });
}
