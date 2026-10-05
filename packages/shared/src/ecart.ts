import { REPS_MAX_1RM } from "./records.js";
import type { TypeSerie } from "./routines.js";
import { estimate1RM } from "./training.js";

type Valeurs = { chargeKg: number | null; reps: number | null };

/** Ce qui a changé d'une série à la même position de la séance précédente (D123). */
export type Ecart =
  | { genre: "charge"; deltaKg: number }
  | { genre: "reps"; delta: number }
  | { genre: "egal" };

/**
 * L'écart avec la série précédente : la charge d'abord (c'est elle qu'on monte),
 * puis les répétitions. `null` sans précédente ou sans répétitions à comparer.
 */
export function ecartSerie(serie: Valeurs, precedente: Valeurs | undefined): Ecart | null {
  if (!precedente || serie.reps === null || precedente.reps === null) return null;
  if (serie.chargeKg !== null && precedente.chargeKg !== null) {
    const deltaKg = Math.round((serie.chargeKg - precedente.chargeKg) * 100) / 100;
    if (deltaKg !== 0) return { genre: "charge", deltaKg };
  }
  const delta = serie.reps - precedente.reps;
  return delta === 0 ? { genre: "egal" } : { genre: "reps", delta };
}

/**
 * La courbe d'un exercice (D124) : le meilleur 1RM estimé de chaque séance, des
 * séries faites hors échauffement, avec une charge et au plus 12 répétitions
 * (au-delà, Epley n'a plus de sens, comme pour le record). Ordre chronologique ; une
 * séance sans telle série n'a pas de point.
 */
export function courbeUnRm(
  seances: readonly {
    debut: string;
    series: readonly {
      type: TypeSerie;
      chargeKg: number | null;
      reps: number | null;
      faite: boolean;
    }[];
  }[],
): { date: string; valeur: number }[] {
  const points: { date: string; valeur: number }[] = [];
  for (const s of seances) {
    let max = 0;
    for (const x of s.series) {
      if (!x.faite || x.type === "ECHAUFFEMENT" || x.chargeKg === null || !x.reps) continue;
      if (x.reps > REPS_MAX_1RM) continue;
      max = Math.max(max, estimate1RM(x.chargeKg, x.reps));
    }
    if (max > 0) points.push({ date: s.debut, valeur: max });
  }
  return points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
