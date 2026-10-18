import type { ExerciceResume } from "./exercices.js";
import { recordsDe, type SerieHisto } from "./records.js";

/** Les chiffres d'un exercice fait, par slug (D312). */
export type ChiffresExercice = {
  slug: string;
  /** ISO de la dernière séance où il figure. */
  derniereFois: string;
  /** Le meilleur 1RM estimé (record `UN_RM`), `null` sans série chargée qui compte. */
  meilleur1Rm: number | null;
};

/**
 * Un exercice que l'utilisateur a fait : sa ligne du catalogue et ses chiffres (D312). La
 * ligne vient avec : la page Exercices liste les faits sans charger tout le catalogue.
 */
export type ExerciceFait = ExerciceResume & Omit<ChiffresExercice, "slug">;

/**
 * Par exercice, la dernière fois et le meilleur 1RM. Le 1RM vient de `recordsDe` : mêmes
 * règles que les records (séries faites, hors échauffement, 12 reps au plus).
 */
export function resumerExercicesFaits(
  series: readonly (SerieHisto & { slug: string; date: string })[],
): ChiffresExercice[] {
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
