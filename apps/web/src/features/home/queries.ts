import type { TableauDeBord } from "@better-lift/shared";
import { queryOptions } from "@tanstack/react-query";
import { api, lire } from "@/lib/api";

/** `["tableau-de-bord"]` : la racine qu'invalide la suppression d'une séance. */
const tableauDeBordKeys = {
  all: ["tableau-de-bord"] as const,
  depuis: (depuis: string) => ["tableau-de-bord", depuis] as const,
};

export const tableauDeBordQuery = (depuis: string) =>
  queryOptions({
    queryKey: tableauDeBordKeys.depuis(depuis),
    queryFn: async (): Promise<TableauDeBord> => {
      const res = await lire(
        () => api["tableau-de-bord"].$get({ query: { depuis } }),
        "L'accueil n'a pas pu se charger.",
      );
      return res.json();
    },
  });
