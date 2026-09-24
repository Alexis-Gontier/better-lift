import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

/**
 * Les lectures du mobile. Mêmes routes que le web, même client typé : seules
 * l'URL et la façon de joindre la session changent (voir `api.ts`).
 */

export function optionsRoutines() {
  return queryOptions({
    queryKey: ["routines", "liste"],
    queryFn: async () => {
      const res = await api.routines.$get();
      if (!res.ok) throw new Error("Les routines n'ont pas pu être chargées.");
      return (await res.json()).routines;
    },
  });
}

export function optionsRoutine(id: string) {
  return queryOptions({
    queryKey: ["routines", "detail", id],
    queryFn: async () => {
      const res = await api.routines[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette routine n'a pas pu être chargée.");
      return res.json();
    },
  });
}

export function optionsCatalogue(q: string) {
  return queryOptions({
    queryKey: ["exercices", "liste", { q }],
    queryFn: async () => {
      const res = await api.exercices.$get({ query: q ? { q, taille: "30" } : { taille: "30" } });
      if (!res.ok) throw new Error("Le catalogue n'a pas pu être chargé.");
      return (await res.json()).exercices;
    },
  });
}
