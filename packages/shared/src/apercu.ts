import type { TypeSerie } from "./routines.js";

type SerieApercu = {
  type: TypeSerie;
  reps: number | null;
  chargeKg: number | null;
  faite: boolean;
};

/** Un exercice tel que le fil de l'Accueil le montre (D119). */
export type ApercuExercice = {
  slug: string;
  nom: string;
  image: string | null;
  /** Les séries faites, échauffement compris : ce qu'on a fait de l'exercice. */
  nbSeries: number;
  /** La meilleure série faite hors échauffement, `null` sans série qui compte. */
  meilleure: { chargeKg: number | null; reps: number } | null;
};

/**
 * La meilleure série : la plus lourde, puis à charge égale la plus longue ; au
 * poids du corps (charge nulle), la plus longue. L'échauffement ne compte pas (D5).
 */
export function meilleureSerieComptee(series: readonly SerieApercu[]): ApercuExercice["meilleure"] {
  let m: ApercuExercice["meilleure"] = null;
  for (const x of series) {
    if (!x.faite || x.type === "ECHAUFFEMENT" || x.reps === null || x.reps <= 0) continue;
    const charge = x.chargeKg ?? 0;
    const max = m?.chargeKg ?? 0;
    if (!m || charge > max || (charge === max && x.reps > m.reps)) {
      m = { chargeKg: x.chargeKg, reps: x.reps };
    }
  }
  return m;
}

/** Les `n` premiers exercices d'une séance, pour le fil (D119). */
export function apercuExercices(
  exercices: readonly {
    slug: string;
    nom: string;
    image: string | null;
    series: readonly SerieApercu[];
  }[],
  n = 3,
): ApercuExercice[] {
  return exercices.slice(0, n).map((e) => ({
    slug: e.slug,
    nom: e.nom,
    image: e.image,
    nbSeries: e.series.filter((x) => x.faite).length,
    meilleure: meilleureSerieComptee(e.series),
  }));
}
