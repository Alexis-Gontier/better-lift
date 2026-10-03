import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  chargerPrecedents,
  optionsCatalogueComplet,
  optionsRecords,
  optionsRoutine,
  optionsRoutines,
} from "../lib/requetes";

/**
 * Remplit le cache persistant pendant qu'il y a du réseau (D96) : la liste et
 * le détail de chaque routine, leurs précédents et leurs records, le catalogue
 * complet. Monté
 * sous la garde de session, il ne s'exécute que connecté. Ne rend rien.
 */
export function PreparerHorsLigne() {
  const client = useQueryClient();
  const routines = useQuery(optionsRoutines());
  useQuery(optionsCatalogueComplet());

  useEffect(() => {
    if (!routines.data) return;
    for (const r of routines.data) {
      void client
        .fetchQuery(optionsRoutine(r.id))
        .then((d) => {
          const slugs = d.exercices.map((e) => e.slug);
          // Les records servent à la fin de séance (D111), réseau ou pas.
          for (const slug of slugs) void client.prefetchQuery(optionsRecords(slug));
          return chargerPrecedents(client, slugs);
        })
        .catch(() => {});
    }
  }, [routines.data, client]);

  return null;
}
