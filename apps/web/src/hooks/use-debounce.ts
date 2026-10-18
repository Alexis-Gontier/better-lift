import { useEffect, useState } from "react";

/** La valeur, une fois qu'elle n'a plus bougé depuis `delai` ms : une requête par pause de frappe. */
export function useDebounce<T>(valeur: T, delai = 250): T {
  const [stable, setStable] = useState(valeur);
  useEffect(() => {
    const t = window.setTimeout(() => setStable(valeur), delai);
    return () => window.clearTimeout(t);
  }, [valeur, delai]);
  return stable;
}
