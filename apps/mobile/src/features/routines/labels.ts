import { type SetType } from "@better-lift/validators";

/**
 * Libellés des types de série, jumeaux de ceux du web.
 *
 * Dupliqués à dessein : seuls `core`, `validators` et `api-client` traversent
 * la frontière web / mobile (règle non négociable n°2), et une table de
 * libellés n'est ni de la logique métier ni un contrat.
 */
export const SET_TYPE_SHORT: Record<SetType, string> = {
  WARMUP: "Éch.",
  NORMAL: "",
  FAILURE: "Échec",
  DROP: "Dég.",
};

/**
 * Une série d'échauffement ne compte ni dans le volume ni dans les records
 * (invariant 1, doc 03) : la distinguer n'est pas cosmétique.
 */
export const SET_TYPE_TONE: Record<SetType, string> = {
  WARMUP: "#e8c468",
  NORMAL: "#9aa3ad",
  FAILURE: "#f08a7a",
  DROP: "#7fb4e8",
};

/** Format « 3:00 » à partir de secondes, pour un temps de repos. */
export function formatRest(seconds: number): string {
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
