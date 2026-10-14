import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * L'historique. Clés sous `["sessions"]`. Les séances arrivent du mobile ; le web
 * n'écrit qu'une chose, la suppression (D140).
 */
export function sessionsOptions() {
  return infiniteQueryOptions({
    queryKey: ["sessions", "list"],
    queryFn: async ({ pageParam }) => {
      const res = await api.seances.$get({ query: { page: String(pageParam) } });
      if (!res.ok) throw new Error("L'historique n'a pas pu être chargé.");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (d) => (d.page * d.taille < d.total ? d.page + 1 : undefined),
  });
}

export function sessionOptions(id: string) {
  return queryOptions({
    queryKey: ["sessions", "detail", id],
    queryFn: async () => {
      const res = await api.seances[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette séance n'a pas pu être chargée.");
      return res.json();
    },
  });
}

/**
 * Supprimer une séance (D140). Le détail supprimé est RETIRÉ, pas invalidé : le
 * relire donnerait un 404. Tout le reste de `["sessions"]` (le fil, « la dernière
 * fois » des routines, les relevés comparés), les stats et les records en dépendaient.
 */
export function useDeleteSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.seances[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("La séance n'a pas pu être supprimée.");
    },
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: ["sessions", "detail", id] });
      return Promise.all(
        [["sessions"], ["stats"], ["records"]].map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
