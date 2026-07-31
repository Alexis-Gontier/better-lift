import { roundTo, toNumber } from "./decimal.js";
import { type DecimalLike } from "./types.js";

/**
 * Tout est stocké en métrique (règle non négociable n°3). Le kg/lb est une
 * préférence d'affichage : ces conversions ne servent qu'à la présentation,
 * jamais à la persistance.
 */
const LB_PER_KG = 2.20462262185;

export const UNIT_SYSTEMS = ["METRIC", "IMPERIAL"] as const;
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];

export function kgToLb(kg: DecimalLike): number {
  return roundTo(toNumber(kg) * LB_PER_KG, 2);
}

export function lbToKg(lb: DecimalLike): number {
  return roundTo(toNumber(lb) / LB_PER_KG, 2);
}

/** Convertit une charge métrique vers l'unité d'affichage de l'utilisateur. */
export function toDisplayWeight(kg: DecimalLike, system: UnitSystem): number {
  return system === "IMPERIAL" ? kgToLb(kg) : roundTo(toNumber(kg), 2);
}

/** Chemin inverse : ce que saisit l'utilisateur redevient des kg avant envoi. */
export function fromDisplayWeight(value: DecimalLike, system: UnitSystem): number {
  return system === "IMPERIAL" ? lbToKg(value) : roundTo(toNumber(value), 2);
}

export function weightUnitLabel(system: UnitSystem): "kg" | "lb" {
  return system === "IMPERIAL" ? "lb" : "kg";
}

/** Les distances sont stockées en mètres ; l'affichage impérial est en miles. */
export function metersToMiles(meters: DecimalLike): number {
  return roundTo(toNumber(meters) / 1609.344, 3);
}

export function milesToMeters(miles: DecimalLike): number {
  return roundTo(toNumber(miles) * 1609.344, 2);
}
