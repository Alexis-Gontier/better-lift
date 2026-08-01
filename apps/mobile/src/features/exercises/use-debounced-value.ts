import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur — ici la recherche du catalogue.
 *
 * Sur mobile l'enjeu n'est pas l'historique de navigation mais le réseau :
 * taper « développé » sans débounce partirait en neuf requêtes, dont huit
 * périmées avant d'arriver, sur une connexion qui est souvent celle d'un
 * sous-sol de salle de sport.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
