import { kgToLb, lbToKg, type UnitSystem } from "./units.js";

/**
 * La charge, à l'affichage et à la saisie (D52).
 *
 * Elle est STOCKÉE en kilos, toujours. Tout ce qui l'affiche ou la lit passe par
 * ces deux fonctions avec le système d'unités du profil : un écran qui écrirait
 * « kg » en dur servirait mal un profil impérial, sans que rien ne le signale.
 */

const UNITE: Record<UnitSystem, string> = { metric: "kg", imperial: "lb" };

/** Au-delà, c'est une faute de frappe, pas une charge. */
const CHARGE_MAX_KG = 1000;

export function formaterCharge(kg: number, systeme: UnitSystem): string {
  const valeur = systeme === "imperial" ? kgToLb(kg) : kg;
  // `maximumFractionDigits` retire les zéros inutiles : 80 et non 80,00.
  const texte = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(valeur);
  return `${texte} ${UNITE[systeme]}`;
}

/**
 * Lit une saisie et rend des kilos à deux décimales.
 *
 * Trois issues, que l'éditeur distingue : un nombre ; `null` pour un champ vide,
 * qui veut dire « pas de charge cible » ; `NaN` pour une saisie illisible, qui
 * doit bloquer l'enregistrement plutôt que devenir silencieusement « rien ».
 */
export function lireCharge(texte: string, systeme: UnitSystem): number | null {
  const propre = texte.trim().replace(",", ".");
  if (propre === "") return null;
  if (!/^\d+(\.\d+)?$/.test(propre)) return Number.NaN;

  const valeur = Number(propre);
  const kg = systeme === "imperial" ? lbToKg(valeur) : Math.round(valeur * 100) / 100;
  return kg > CHARGE_MAX_KG ? Number.NaN : kg;
}
