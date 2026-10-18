import { queryOptions } from "@tanstack/react-query";
import { api, lire } from "@/lib/api";
import { exercicesKeys } from "@/lib/exercices";

/**
 * Les lectures propres à la page Exercices (D300). Le catalogue est dans `lib/catalogue.ts`, le
 * détail et l'historique d'un exercice dans `lib/exercices.ts` : d'autres pages les lisent.
 */

/** Les exercices que l'utilisateur a faits, la plus récente d'abord (D312). */
export const faitsQuery = () =>
  queryOptions({
    queryKey: exercicesKeys.faits(),
    queryFn: async () => {
      const res = await lire(
        () => api.exercices.faits.$get(),
        "Vos exercices n'ont pas pu être chargés.",
      );
      return (await res.json()).exercices;
    },
  });
