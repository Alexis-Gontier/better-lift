/**
 * Le pavé numérique de la séance (D109) — la saisie, sans plateforme.
 *
 * Le pavé manipule le TEXTE affiché (« 82,5 »), pas une valeur : « 82, » doit
 * survivre le temps de taper le 5. La lecture en nombre reste à `lireCharge`
 * et à la lecture des reps, au moment d'écrire dans la séance.
 */

export type ChampPave = "charge" | "reps";
export type TouchePave = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | ",";

/** Chiffres avant la virgule (1 000 kg) et après (82,25). */
const ENTIERS_MAX = { charge: 4, reps: 3 } as const;
const DECIMALES_MAX = 2;

/**
 * Une touche appuyée. `neuf` : la case porte encore sa valeur d'avant — la
 * première touche la REMPLACE, comme un champ dont le texte serait sélectionné.
 */
export function toucherPave(
  texte: string,
  touche: TouchePave,
  { champ, neuf }: { champ: ChampPave; neuf: boolean },
): string {
  const base = neuf ? "" : texte;
  if (touche === ",") {
    if (champ === "reps" || base.includes(",")) return base;
    return base === "" ? "0," : `${base},`;
  }
  const [entiers = "", decimales] = base.split(",");
  if (decimales !== undefined) {
    return decimales.length >= DECIMALES_MAX ? base : base + touche;
  }
  // Pas de zéro en tête : « 05 » se lit 5.
  if (entiers === "0") return touche;
  return entiers.length >= ENTIERS_MAX[champ] ? base : base + touche;
}

export function effacerSurPave(texte: string): string {
  return texte.slice(0, -1);
}

const FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, useGrouping: false });

/**
 * ±2,5 au pouce, dans l'unité affichée. Une case vide part de zéro ; on ne
 * descend jamais sous zéro.
 */
export function ajusterSurPave(texte: string, pas: number): string {
  const valeur = Number(texte.replace(",", "."));
  const depart = Number.isFinite(valeur) ? valeur : 0;
  return FORMAT.format(Math.max(0, Math.round((depart + pas) * 100) / 100));
}

/** Un entier de 0 à 999, ou `null` si vide ; `NaN` signale une saisie à corriger. */
export function lireReps(texte: string): number | null {
  const propre = texte.trim();
  if (propre === "") return null;
  if (!/^\d+$/.test(propre) || Number(propre) > 999) return Number.NaN;
  return Number(propre);
}
