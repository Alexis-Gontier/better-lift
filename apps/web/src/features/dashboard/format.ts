import { type StatsRange } from "@better-lift/validators";

/**
 * Mises en forme du tableau de bord, isolées du rendu.
 *
 * Aucune de ces fonctions ne convertit d'unité : les charges restent en kg et
 * passent par `<Weight />`, seul endroit du web qui convertit (doc 05). Ce qui
 * se joue ici est l'échelle et l'arrondi — un volume hebdomadaire s'écrit en
 * tonnes, pas en 84 250 kg.
 */

export const RANGE_LABELS: Record<StatsRange, string> = {
  "7d": "7 jours",
  "30d": "30 jours",
  "90d": "90 jours",
  "1y": "12 mois",
  all: "Tout",
};

/** Fenêtres proposées, de la plus courte à la plus longue. */
export const RANGE_OPTIONS: readonly StatsRange[] = ["7d", "30d", "90d", "1y", "all"];

/**
 * Variation relative entre deux périodes, en pourcentage.
 *
 * `null` quand la période précédente est vide : passer de 0 à 12 séances n'est
 * pas « +∞ % » ni « +1200 % », c'est un début. L'appelant affiche alors un
 * tiret plutôt qu'un nombre qui ne veut rien dire.
 */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }

  return (current - previous) / previous;
}

/** Sens d'une variation, pour choisir l'icône et la couleur. */
export type Trend = "up" | "down" | "flat";

/**
 * Une variation inférieure à 1 % est traitée comme stable.
 *
 * Sans ce seuil, un écart de 0,3 % afficherait une flèche montante et laisserait
 * croire à une progression là où il n'y a que du bruit de mesure.
 */
export function trendOf(change: number | null): Trend {
  if (change === null || Math.abs(change) < 0.01) {
    return "flat";
  }

  return change > 0 ? "up" : "down";
}

/**
 * Volume en tonnes au-delà de 1 000 kg, en kg en deçà.
 *
 * Un total hebdomadaire se compte en dizaines de tonnes : l'écrire en
 * kilogrammes donne un nombre à six chiffres que personne ne lit. En dessous
 * d'une tonne, la tonne est au contraire trop grossière.
 *
 * La chaîne d'entrée vient de l'API (`Decimal` sérialisé, règle n°4). Le
 * `Number` n'est ici qu'un arrondi d'affichage, jamais un calcul métier.
 */
export function formatVolume(volumeKg: string, locale: string): string {
  const kg = Number(volumeKg);

  if (!Number.isFinite(kg)) {
    return "—";
  }

  if (kg < 1000) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(kg)} kg`;
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(kg / 1000)} t`;
}

/** Durée cumulée en heures et minutes : « 4 h 12 », « 48 min ». */
export function formatTotalDuration(seconds: number): string {
  if (seconds <= 0) {
    return "—";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }

  // Les minutes sont sur deux chiffres : « 4 h 05 » et non « 4 h 5 ».
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

export function formatPercent(change: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(change);
}

/**
 * Intensité d'une case de heatmap, de 0 à 4.
 *
 * Cinq paliers comme la heatmap de contributions dont elle s'inspire : moins
 * ne distingue pas une bonne semaine d'une excellente, plus produit des nuances
 * que l'œil ne sépare plus. Deux séances dans la journée suffisent à saturer —
 * c'est déjà beaucoup, et le but est de montrer la régularité, pas le volume.
 */
export function heatLevel(workoutCount: number): 0 | 1 | 2 | 3 | 4 {
  if (workoutCount <= 0) {
    return 0;
  }

  return Math.min(workoutCount + 1, 4) as 1 | 2 | 3 | 4;
}

/**
 * Découpe une suite de jours en colonnes de sept, une par semaine.
 *
 * La fenêtre servie par l'API commence toujours un lundi et compte un multiple
 * de sept jours : les colonnes sont donc pleines et la grille rectangulaire.
 */
export function toWeekColumns<T>(days: readonly T[]): T[][] {
  const columns: T[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    columns.push(days.slice(index, index + 7));
  }

  return columns;
}
