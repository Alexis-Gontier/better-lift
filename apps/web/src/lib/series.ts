import type { TypeSerie } from "@better-lift/shared";

/**
 * L'affichage des séries, commun aux Routines et à l'Historique : l'étiquette de chaque série et
 * sa couleur (D248, D249). Sans React ; la pastille est `components/set-badge.tsx`.
 */

/**
 * Les types de série, dans l'ordre du menu de Hevy ; `short` est l'étiquette de la ligne et
 * `tone` sa couleur (seule couleur de l'éditeur : elle porte un sens, D249).
 */
export const SET_TYPES: readonly {
  value: TypeSerie;
  label: string;
  short: string;
  tone: string;
}[] = [
  { value: "ECHAUFFEMENT", label: "Échauffement", short: "W", tone: "text-amber-500" },
  { value: "NORMALE", label: "Normale", short: "", tone: "text-foreground" },
  // Rose plutôt que rouge : le rouge appartient au danger (D36, D252).
  { value: "ECHEC", label: "Échec", short: "F", tone: "text-rose-600" },
  { value: "DEGRESSIVE", label: "Dégressive", short: "D", tone: "text-sky-500" },
];

/** La couleur de l'étiquette d'une série. */
export function setTone(type: TypeSerie): string {
  return SET_TYPES.find((t) => t.value === type)?.tone ?? "text-foreground";
}

/**
 * L'étiquette de chaque série, comme dans Hevy : W, F ou D pour une série typée, et un numéro
 * pour les séries normales, comptées entre elles (W, 1, 2, D → W 1 2 D).
 */
export function setLabels(series: readonly { type: TypeSerie }[]): string[] {
  let n = 0;
  return series.map((s) =>
    s.type === "NORMALE" ? String(++n) : (SET_TYPES.find((t) => t.value === s.type)?.short ?? "?"),
  );
}
