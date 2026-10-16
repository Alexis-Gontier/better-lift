export type Theme = "light" | "dark";

const KEY = "better-lift-theme";

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Stockage indisponible (navigation privée) : le thème vaut pour la session.
  }
}
