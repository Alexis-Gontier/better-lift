import { jourCivil } from "@/lib/locale";

/**
 * Les séances groupées par mois civil `AAAA-MM`, dans le fuseau du web — jamais en UTC : le 31 à
 * 23 h 30 à Paris est déjà le 1er en UTC. L'ordre des séances est gardé (la plus récente d'abord).
 */
export function parMois<T extends { debut: string }>(
  seances: readonly T[],
  jour: (instant: string) => string = jourCivil,
): { mois: string; seances: T[] }[] {
  const groupes: { mois: string; seances: T[] }[] = [];
  for (const s of seances) {
    const mois = jour(s.debut).slice(0, 7);
    const dernier = groupes.at(-1);
    if (dernier?.mois === mois) dernier.seances.push(s);
    else groupes.push({ mois, seances: [s] });
  }
  return groupes;
}
