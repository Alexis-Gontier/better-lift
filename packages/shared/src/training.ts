/**
 * 1RM estimé par la formule d'Epley (D4) : poids × (1 + reps / 30).
 * Arrondi à la décimale — au-delà, la précision est illusoire.
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}
