import { roundKg, toNumber } from "./decimal.js";
import { type DecimalLike } from "./types.js";

export const ONE_RM_FORMULAS = ["EPLEY", "BRZYCKI"] as const;
export type OneRepMaxFormula = (typeof ONE_RM_FORMULAS)[number];

/**
 * Bornes de validité de l'estimation (D11). Au-delà de 12 répétitions, toutes
 * les formules divergent au point de ne plus rien dire d'utile — on préfère
 * ne rien afficher qu'afficher un nombre faux.
 */
export const MIN_1RM_REPS = 1;
export const MAX_1RM_REPS = 12;

/**
 * 1RM estimé, en kg. Renvoie `null` quand l'estimation n'a pas de sens :
 * hors bornes de répétitions, ou charge nulle (poids de corps, durée…).
 *
 * Epley par défaut (D11) ; Brzycki proposé en réglage à partir de la V2.
 */
export function estimate1RM(
  weightKg: DecimalLike,
  reps: number,
  formula: OneRepMaxFormula = "EPLEY",
): number | null {
  const weight = toNumber(weightKg);

  if (weight <= 0 || !Number.isInteger(reps) || reps < MIN_1RM_REPS || reps > MAX_1RM_REPS) {
    return null;
  }

  if (reps === 1) {
    return roundKg(weight);
  }

  const estimated = formula === "BRZYCKI" ? (weight * 36) / (37 - reps) : weight * (1 + reps / 30);

  return roundKg(estimated);
}
