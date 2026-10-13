import type { Periode } from "@better-lift/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FUSEAU } from "@/lib/fuseau";

/**
 * Les stats d'une période (D125), découpées dans le fuseau : il est dans la clé.
 * Mêmes clés que le mobile. Le web n'écrit pas de séance : rien à invalider ici.
 */
export function optionsStatsPeriode(periode: Periode, decalage = 0) {
  return queryOptions({
    // Le décalage (D190) est dans la clé : chaque période passée a son cache.
    queryKey: ["stats", "periode", periode, decalage, FUSEAU],
    queryFn: async () => {
      const res = await api.stats.periode.$get({
        query: { fuseau: FUSEAU, periode, decalage: String(decalage) },
      });
      if (!res.ok) throw new Error("Les statistiques n'ont pas pu être chargées.");
      return res.json();
    },
    // On garde la période affichée pendant qu'on recule : pas de squelette à chaque clic.
    placeholderData: (precedent) => precedent,
  });
}

/** Les préférences du compte (D129) : l'objectif hebdomadaire des tuiles. */
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
