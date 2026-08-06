import { toDisplayWeight, type UnitSystem } from "@better-lift/core";
import { type StatsRange } from "@better-lift/validators";

/**
 * Mises en forme du tableau de bord, isolées du rendu.
 *
 * Ce qui s'y joue est l'échelle et l'arrondi — un volume hebdomadaire s'écrit
 * en tonnes, pas en 84 250 kg. `<Weight />` ne sait pas faire ça : il rend une
 * charge telle quelle, ce qui donnerait un nombre à six chiffres.
 *
 * `formatVolume` est donc le **second** endroit du web à convertir une charge,
 * et le seul autre. Il passe par `toDisplayWeight` de `packages/core`, comme
 * `<Weight />` : la règle non négociable n°4 interdit la conversion à la main,
 * pas la mise à l'échelle d'un agrégat.
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
 * Volume cumulé, dans le système d'unités du profil.
 *
 * Un total hebdomadaire se compte en dizaines de tonnes : l'écrire en
 * kilogrammes donne un nombre à six chiffres que personne ne lit. En dessous
 * d'une tonne, la tonne est au contraire trop grossière — d'où la bascule.
 *
 * Le pendant impérial est la **tonne courte** (2 000 lb), avec le même seuil
 * relatif. Elle est notée « t (US) » : écrire « t » des deux côtés ferait
 * passer deux grandeurs différentes pour la même, ce qui est exactement le
 * genre de confusion qu'un tracker de charges ne peut pas se permettre.
 *
 * La conversion passe par `packages/core` (règle non négociable n°4) — c'est
 * le pendant de `<Weight>` pour une valeur agrégée, que le composant ne sait
 * pas mettre à l'échelle. La chaîne d'entrée vient de l'API ; le `Number` n'est
 * ici qu'un arrondi d'affichage, jamais un calcul métier.
 */
export function formatVolume(volumeKg: string, locale: string, system: UnitSystem): string {
  if (!Number.isFinite(Number(volumeKg))) {
    return "—";
  }

  const value = toDisplayWeight(volumeKg, system);
  const [threshold, unit, bigUnit] =
    system === "IMPERIAL" ? [2000, "lb", "t (US)"] : [1000, "kg", "t"];

  if (value < threshold) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${unit}`;
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / threshold)} ${bigUnit}`;
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
