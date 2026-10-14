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

/** Les préférences du compte (D129) : objectif hebdomadaire, repos par défaut. */
export function optionsPreferences() {
  return queryOptions({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await api.preferences.$get();
      if (!res.ok) throw new Error("Les préférences n'ont pas pu être chargées.");
      return res.json();
    },
  });
}

/**
 * Écrire les préférences du compte (D129). Même clé que la lecture
 * (`["preferences"]`) : le Profil relit aussitôt la nouvelle valeur.
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
