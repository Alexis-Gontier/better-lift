import { cleJour } from "./calendar.js";
import { courbeUnRm } from "./ecart.js";
import type { TypeSerie } from "./routines.js";
import { lundiCourant, type Periode, SEMAINES_PERIODE } from "./stats.js";

const JOUR_MS = 86_400_000;

/** Une séance, réduite à ce que la progression d'un exercice en lit. */
export type SeanceProgres = {
  debut: string;
  exercices: {
    slug: string;
    nom: string;
    image: string | null;
    series: { type: TypeSerie; chargeKg: number | null; reps: number | null; faite: boolean }[];
  }[];
};

/**
 * Un exercice fait sur la période (D173) : son 1RM estimé à la première et à la
 * dernière séance de la période. `null` quand aucune série ne s'y prête (plus de
 * 12 reps, sans charge) : l'exercice reste listé, sans chiffre.
 */
export type ExerciceProgres = {
  slug: string;
  nom: string;
  image: string | null;
  derniereFois: string;
  unRm: number | null;
  unRmDebut: number | null;
};

/**
 * « Tes exercices » de l'onglet Progrès (D173) : chaque exercice fait sur la
 * période (semaines glissantes alignées sur le lundi, dans le fuseau, comme
 * `calculerPeriode`), du plus récent au plus ancien.
 */
export function progresExercices(
  seances: readonly SeanceProgres[],
  maintenant: Date,
  fuseau: string,
  periode: Periode,
): ExerciceProgres[] {
  const { lundiMs } = lundiCourant(maintenant, fuseau);
  const premier = new Date(lundiMs - (SEMAINES_PERIODE[periode] - 1) * 7 * JOUR_MS)
    .toISOString()
    .slice(0, 10);
  const parSlug = new Map<
    string,
    {
      slug: string;
      nom: string;
      image: string | null;
      seances: { debut: string; series: SeanceProgres["exercices"][number]["series"] }[];
    }
  >();
  for (const s of seances) {
    if (cleJour(s.debut, fuseau) < premier) continue;
    for (const e of s.exercices) {
      const x = parSlug.get(e.slug) ?? { slug: e.slug, nom: e.nom, image: e.image, seances: [] };
      x.seances.push({ debut: s.debut, series: e.series });
      parSlug.set(e.slug, x);
    }
  }
  return [...parSlug.values()]
    .map((x) => {
      const courbe = courbeUnRm(x.seances);
      const derniereFois = x.seances
        .map((s) => s.debut)
        .reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b));
      return {
        slug: x.slug,
        nom: x.nom,
        image: x.image,
        derniereFois,
        unRm: courbe.at(-1)?.valeur ?? null,
        unRmDebut: courbe[0]?.valeur ?? null,
      };
    })
    .sort((a, b) => Date.parse(b.derniereFois) - Date.parse(a.derniereFois));
}
