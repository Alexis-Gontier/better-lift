export type UnitSystem = "metric" | "imperial";

const LB_PAR_KG = 2.2046226218;

/** Arrondi à 0,01 : deux décimales suffisent pour une charge. */
export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PAR_KG * 100) / 100;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / LB_PAR_KG) * 100) / 100;
}
