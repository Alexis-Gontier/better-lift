/**
 * La saisie d'une série en séance (D184) — sans plateforme. L'écran tient le
 * TEXTE tapé (« 82, » doit survivre le temps de taper le 5) ; la lecture en
 * nombre se fait à l'écriture dans la séance, par `lireCharge` et `lireReps`.
 */
export type ChampSaisie = "charge" | "reps";

/** Un entier de 0 à 999, ou `null` si vide ; `NaN` signale une saisie à corriger. */
export function lireReps(texte: string): number | null {
  const propre = texte.trim();
  if (propre === "") return null;
  if (!/^\d+$/.test(propre) || Number(propre) > 999) return Number.NaN;
  return Number(propre);
}
