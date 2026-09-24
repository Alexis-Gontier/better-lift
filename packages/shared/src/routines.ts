/**
 * Les routines : des gabarits de séance, décrits série par série (D47).
 *
 * Ces types sont ceux que l'API rendra : les données factices du dessin ont
 * déjà leur forme, pour que le branchement ne change que la source.
 */

export const TYPES_SERIE = ["ECHAUFFEMENT", "NORMALE", "ECHEC", "DEGRESSIVE"] as const;

export type TypeSerie = (typeof TYPES_SERIE)[number];

export const LIBELLE_TYPE_SERIE: Record<TypeSerie, string> = {
  ECHAUFFEMENT: "Échauffement",
  NORMALE: "Normale",
  ECHEC: "Échec",
  DEGRESSIVE: "Dégressive",
};

/** Pour le tableau des séries, où la place manque. */
export const ABREGE_TYPE_SERIE: Record<TypeSerie, string> = {
  ECHAUFFEMENT: "É",
  NORMALE: "N",
  ECHEC: "Éc",
  DEGRESSIVE: "D",
};

export type SerieRoutine = {
  type: TypeSerie;
  repsCible: number | null;
  /** Toujours en kilos ; l'affichage passe par `formaterCharge` (D52). */
  chargeCibleKg: number | null;
};

export type ExerciceRoutine = {
  slug: string;
  /** Le nom français du catalogue. */
  nom: string;
  reposSec: number | null;
  series: SerieRoutine[];
};

export type RoutineDetail = { id: string; nom: string; exercices: ExerciceRoutine[] };

export type RoutineResume = { id: string; nom: string; nbExercices: number; nbSeries: number };
