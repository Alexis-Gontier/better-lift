import { useSyncExternalStore } from "react";

/**
 * Une valeur en mémoire que plusieurs composants lisent sans passer par l'URL ni le serveur :
 * un état d'écran (D238 : la ligne brouillon suit le nom tapé dans le panneau).
 */
export function signal<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return {
    get: () => value,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      for (const l of listeners) l();
    },
    use: (): T => useSyncExternalStore(subscribe, () => value),
  };
}
