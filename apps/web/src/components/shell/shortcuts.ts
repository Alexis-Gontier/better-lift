import type { FileRouteTypes } from "@/routeTree.gen";

type To = FileRouteTypes["to"];

export type ShortcutAction =
  | { type: "navigate"; to: To }
  | { type: "help" }
  | { type: "new-routine" };

export type Pending = "g" | null;
export type ShortcutResult = { action: ShortcutAction | null; pending: Pending };

/** `G` puis une lettre : la lettre mène à la page. */
const GO_TO: Record<string, To> = {
  a: "/",
  p: "/planning",
  r: "/routines",
  e: "/exercises",
  h: "/history",
  g: "/progress",
  c: "/body",
  s: "/settings/account",
};

export function resolveShortcut(pending: Pending, rawKey: string): ShortcutResult {
  const key = rawKey.toLowerCase();
  if (pending === "g") {
    const to = GO_TO[key];
    return { action: to ? { type: "navigate", to } : null, pending: null };
  }
  if (key === "g") return { action: null, pending: "g" };
  if (key === "?") return { action: { type: "help" }, pending: null };
  if (key === "n") return { action: { type: "new-routine" }, pending: null };
  return { action: null, pending: null };
}

/** Ce que liste la fenêtre des raccourcis. */
export const SHORTCUT_LIST: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "Ouvrir la recherche" },
  { keys: ["Ctrl", "B"], label: "Replier la barre latérale" },
  { keys: ["G", "A"], label: "Aller à l'Accueil" },
  { keys: ["G", "P"], label: "Aller au Planning" },
  { keys: ["G", "R"], label: "Aller aux Routines" },
  { keys: ["G", "E"], label: "Aller aux Exercices" },
  { keys: ["G", "H"], label: "Aller à l'Historique" },
  { keys: ["G", "G"], label: "Aller à la Progression" },
  { keys: ["G", "C"], label: "Aller à Corps" },
  { keys: ["G", "S"], label: "Aller aux Paramètres" },
  { keys: ["N"], label: "Nouvelle routine (sur Routines)" },
  { keys: ["?"], label: "Afficher les raccourcis" },
];
