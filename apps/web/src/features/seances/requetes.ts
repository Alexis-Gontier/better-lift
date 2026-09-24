import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * L'historique. Clés sous `["seances"]` : aucune écriture ici — les séances
 * arrivent du mobile —, donc rien à invalider depuis le web.
 */
export function optionsSeances() {
  return infiniteQueryOptions({
    queryKey: ["seances", "liste"],
    queryFn: async ({ pageParam }) => {
      const res = await api.seances.$get({ query: { page: String(pageParam) } });
      if (!res.ok) throw new Error("L'historique n'a pas pu être chargé.");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (d) => (d.page * d.taille < d.total ? d.page + 1 : undefined),
  });
}

export function optionsSeance(id: string) {
  return queryOptions({
    queryKey: ["seances", "detail", id],
    queryFn: async () => {
      const res = await api.seances[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette séance n'a pas pu être chargée.");
      return res.json();
    },
  });
}

export function optionsRecords(slug: string) {
  return queryOptions({
    queryKey: ["records", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].records.$get({ param: { slug } });
      if (!res.ok) throw new Error("Les records n'ont pas pu être chargés.");
      return (await res.json()).records;
    },
  });
}
