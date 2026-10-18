import { recordsDe, type SerieHisto } from "./records.js";

/** Ce que la page Exercices du web joint au catalogue, pour un exercice fait (D312). */
export type ExerciceFait = {
  slug: string;
  /** ISO de la dernière séance où il figure. */
  derniereFois: string;
  /** Le meilleur 1RM estimé (record `UN_RM`), `null` sans série chargée qui compte. */
  meilleur1Rm: number | null;
};

/**
 * Par exercice, la dernière fois et le meilleur 1RM. Le 1RM vient de `recordsDe` : mêmes
 * règles que les records (séries faites, hors échauffement, 12 reps au plus).
 */
export function resumerExercicesFaits(
  series: readonly (SerieHisto & { slug: string; date: string })[],
): ExerciceFait[] {
  const parSlug = new Map<string, (SerieHisto & { date: string })[]>();
  for (const { slug, ...serie } of series) {
    const liste = parSlug.get(slug) ?? [];
    liste.push(serie);
    parSlug.set(slug, liste);
  }
  return [...parSlug].map(([slug, liste]) => {
    const chrono = [...liste].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const unRm = recordsDe(chrono).find((r) => r.type === "UN_RM");
    return {
      slug,
      derniereFois: chrono.at(-1)?.date ?? "",
      meilleur1Rm: unRm?.valeur ?? null,
    };
  });
}
