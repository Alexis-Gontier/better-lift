import type { Preferences } from "@better-lift/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Le bilan de toujours (D128) : séances, tonnage, première séance. */
export function optionsBilan() {
  return queryOptions({
    queryKey: ["stats", "bilan"],
    queryFn: async () => {
      const res = await api.stats.bilan.$get();
      if (!res.ok) throw new Error("Le bilan n'a pas pu être chargé.");
      return res.json();
    },
  });
}

/**
 * Écrire les préférences du compte (D129). Même clé que la lecture
 * (`["preferences"]`) : l'objectif des tuiles du Tableau de bord suit aussitôt.
 */
export function useEcrirePreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: Preferences) => {
      const res = await api.preferences.$put({ json: p });
      if (!res.ok) throw new Error("Les préférences n'ont pas pu être enregistrées.");
      return res.json();
    },
    onSuccess: (p) => client.setQueryData(["preferences"], p),
    onSettled: () => client.invalidateQueries({ queryKey: ["preferences"] }),
  });
}
