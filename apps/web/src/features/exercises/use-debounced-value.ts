"use client";

import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur. Utilisé par la recherche instantanée du
 * catalogue (250 ms, doc 05).
 *
 * Sans lui, chaque frappe pousserait une entrée dans l'URL — donc dans
 * l'historique du navigateur — et déclencherait une requête : taper « développé »
 * ferait neuf appels et neuf retours en arrière à annuler.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
