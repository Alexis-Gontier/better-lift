import { queryOptions } from "@tanstack/react-query";
import { api, lire } from "./api";

/**
 * Les lectures d'un exercice que plusieurs pages partagent — la fiche, l'aperçu rapide des
 * routines et de l'historique, le fil d'Ariane (D306). `["exercices"]` est la racine que la
 * suppression d'une séance invalide : les faits et les historiques en dépendent.
 */
export const exercicesKeys = {
  all: ["exercices"] as const,
  faits: () => ["exercices", "faits"] as const,
  detail: (slug: string) => ["exercices", "detail", slug] as const,
  historique: (slug: string) => ["exercices", "historique", slug] as const,
};

export const exerciceQuery = (slug: string) =>
  queryOptions({
    queryKey: exercicesKeys.detail(slug),
    queryFn: async () => {
      const res = await lire(
        () => api.exercices[":slug"].$get({ param: { slug } }),
        "Cet exercice n'a pas pu être chargé.",
      );
      return res.json();
    },
    // Le catalogue ne change pas pendant une visite.
    staleTime: 10 * 60_000,
  });

/** Ses séances, la plus récente d'abord. */
export const historiqueQuery = (slug: string) =>
  queryOptions({
    queryKey: exercicesKeys.historique(slug),
    queryFn: async () => {
      const res = await lire(
        () => api.exercices[":slug"].historique.$get({ param: { slug } }),
        "L'historique n'a pas pu être chargé.",
      );
      return (await res.json()).seances;
    },
  });
