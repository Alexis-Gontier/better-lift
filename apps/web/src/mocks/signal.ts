import { useSyncExternalStore } from "react";

/**
 * Une valeur en mémoire que plusieurs composants lisent (D238 : la ligne brouillon suit le nom
 * tapé dans le panneau). Propre au wireframe : l'état serveur viendra de TanStack Query.
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
