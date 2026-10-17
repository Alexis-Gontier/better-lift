import { useSyncExternalStore } from "react";

export type Appearance = "clair" | "sombre" | "systeme";

export const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: "clair", label: "Clair" },
  { value: "sombre", label: "Sombre" },
  { value: "systeme", label: "Système" },
];

const THEME_KEY = "better-lift-theme"; // la clé que lit le script de `index.html`
const listeners = new Set<() => void>();

function read(): Appearance {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" ? "sombre" : t === "light" ? "clair" : "systeme";
  } catch {
    return "systeme";
  }
}

let current: Appearance = read();

/** Le thème s'applique sur-le-champ ; « Système » suit la préférence de l'appareil. */
export function setAppearance(a: Appearance) {
  const dark =
    a === "sombre" || (a === "systeme" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  try {
    if (a === "systeme") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, a === "sombre" ? "dark" : "light");
  } catch {
    // Stockage indisponible : le choix vaut pour la session.
  }
  current = a;
  for (const listener of listeners) listener();
}

/** Le thème choisi, partagé entre le menu du compte et les Préférences. */
export function useAppearance(): Appearance {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
