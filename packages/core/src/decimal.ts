import { type DecimalLike } from "./types.js";

/**
 * Normalise une valeur `Decimal` sérialisée en nombre exploitable.
 *
 * Échoue bruyamment sur une entrée invalide : les données viennent de l'API,
 * déjà validées par Zod, donc une valeur non numérique signale un vrai bug —
 * la masquer par un `parseFloat` qui renvoie `NaN` le propagerait jusque dans
 * un agrégat stocké en base.
 */
export function toNumber(value: DecimalLike): number {
  let parsed: number;

  if (typeof value === "number") {
    parsed = value;
  } else {
    const trimmed = value.trim();
    // `Number("")` vaut 0 : sans ce garde-fou, une chaîne vide passerait pour
    // une charge nulle au lieu de signaler la donnée manquante.
    parsed = trimmed === "" ? Number.NaN : Number(trimmed);
  }

  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Valeur décimale invalide : ${JSON.stringify(value)}`);
  }

  return parsed;
}

/** Variante tolérante aux champs optionnels : `null`/`undefined` valent 0. */
export function toNumberOrZero(value: DecimalLike | null | undefined): number {
  return value === null || value === undefined ? 0 : toNumber(value);
}

/**
 * Arrondit à un nombre de décimales donné, sans dérive de virgule flottante
 * visible (`0.1 + 0.2` ne doit pas ressortir en `0.30000000000000004`).
 */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Valeur non finie : ${value}`);
  }

  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Arrondi au centième, la précision de stockage des charges (`Decimal(7,2)`). */
export function roundKg(value: number): number {
  return roundTo(value, 2);
}
