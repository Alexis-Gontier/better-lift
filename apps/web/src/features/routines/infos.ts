import { useQueries } from "@tanstack/react-query";
import { exerciceQuery } from "@/lib/exercices";

/** Les muscles d'un exercice, tels que les montrent l'éditeur et la silhouette. */
export type InfoExercice = { musclePrincipal: string; musclesSecondaires: readonly string[] };

/**
 * Les muscles des exercices du brouillon : ceux de la routine enregistrée sont connus par son
 * détail ; un exercice ajouté se lit dans le catalogue (même clé que sa fiche, donc en cache).
 */
export function useInfosExercices(
  slugs: readonly string[],
  connus: ReadonlyMap<string, InfoExercice>,
): ReadonlyMap<string, InfoExercice> {
  const manquants = [...new Set(slugs)].filter((s) => !connus.has(s));
  const lus = useQueries({ queries: manquants.map((slug) => exerciceQuery(slug)) });
  const infos = new Map(connus);
  manquants.forEach((slug, i) => {
    const e = lus[i]?.data;
    if (e) infos.set(slug, { musclePrincipal: e.cible, musclesSecondaires: e.secondaires });
  });
  return infos;
}
