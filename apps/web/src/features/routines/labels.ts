import { type SetType } from "@better-lift/validators";

/**
 * Libellés des types de série. Deux formes, et les deux servent :
 *
 * - la forme longue dans un menu, où l'on choisit ;
 * - la forme courte dans la colonne « # » d'un tableau, où la place manque et
 *   où le numéro de série tient déjà le rôle principal.
 */
export const SET_TYPE_LABELS: Record<SetType, string> = {
  WARMUP: "Échauffement",
  NORMAL: "Normale",
  FAILURE: "Jusqu'à l'échec",
  DROP: "Dégressive",
};

export const SET_TYPE_SHORT: Record<SetType, string> = {
  WARMUP: "Éch.",
  NORMAL: "",
  FAILURE: "Échec",
  DROP: "Dég.",
};

/**
 * Une série d'échauffement ne compte ni dans le volume ni dans les records
 * (invariant 1, doc 03). La distinguer visuellement n'est donc pas cosmétique.
 */
export const SET_TYPE_TONE: Record<SetType, string> = {
  WARMUP: "text-amber-400",
  NORMAL: "text-muted-foreground",
  FAILURE: "text-destructive",
  DROP: "text-sky-400",
};

/** Format « 3:00 » à partir de secondes, pour un temps de repos. */
export function formatRest(seconds: number): string {
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
