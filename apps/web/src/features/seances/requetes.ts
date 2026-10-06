import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * L'historique. Clés sous `["seances"]`. Les séances arrivent du mobile ; le web
 * n'écrit qu'une chose, la suppression (D140).
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

/**
 * Supprimer une séance (D140). Le détail supprimé est RETIRÉ, pas invalidé : le
 * relire donnerait un 404. Tout le reste de `["seances"]` (le fil, « la dernière
 * fois » des routines, les relevés comparés), les stats et les records en dépendaient.
 */
export function useSupprimerSeance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.seances[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("La séance n'a pas pu être supprimée.");
    },
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: ["seances", "detail", id] });
      return Promise.all(
        [["seances"], ["stats"], ["records"]].map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
