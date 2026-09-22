export type Theme = "dark" | "light";

// Doit être identique à la clé lue par le script synchrone dans `index.html` :
// sinon le thème restitué au chargement n'est pas celui qu'on a choisi.
const CLE = "better-lift-theme";

export function themeInitial(): Theme {
  try {
    const stocke = localStorage.getItem(CLE);
    if (stocke === "dark" || stocke === "light") return stocke;
  } catch {
    // Navigation privée, stockage bloqué : on retombe sur la préférence système.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function appliquerTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(CLE, t);
  } catch {
    // Sans persistance, le thème reste valable pour la session.
  }
}
