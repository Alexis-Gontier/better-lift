import { seeded } from "./random";
import { addDays, movingAverage } from "./stats";
import { TODAY } from "./today";

type Weighing = { date: string; kg: number };

/** Écart entre la moyenne sur 7 jours de la dernière pesée et celle d'il y a `days` pesées. */
export function averageDelta(weights: Weighing[], days: number): number {
  const avg = movingAverage(
    weights.map((w) => w.kg),
    7,
  );
  const last = avg.at(-1);
  const before = avg.at(-1 - days);
  return last === undefined || before === undefined ? 0 : last - before;
}

export type Measurement = {
  id: string;
  label: string;
  unit: string;
  points: { date: string; value: number }[];
};

function series(
  id: string,
  label: string,
  start: number,
  monthly: number,
  seed: number,
): Measurement {
  const rand = seeded(seed);
  return {
    id,
    label,
    unit: "cm",
    points: Array.from({ length: 6 }, (_, i) => ({
      date: addDays(TODAY, (i - 5) * 30),
      value: Math.round((start + monthly * i + (rand() - 0.5) * 0.6) * 10) / 10,
    })),
  };
}

/** Une mesure par mois sur six mois : les bras et la poitrine montent, la taille descend. */
export const mockMeasurements: Measurement[] = [
  series("bras", "Tour de bras", 37.5, 0.25, 11),
  series("taille", "Tour de taille", 86, -0.6, 12),
  series("cuisse", "Tour de cuisse", 58, 0.2, 13),
  series("poitrine", "Tour de poitrine", 102, 0.3, 14),
];

export const WEIGHT_GOAL = 78;

/**
 * Quand l'objectif sera atteint au rythme actuel (D268) : `perWeek` est la pente de la moyenne,
 * en kg par semaine. Rien si l'on s'en éloigne, si l'on stagne, ou s'il est déjà atteint.
 */
export function goalEta(
  current: number,
  goal: number,
  perWeek: number,
  today: string,
): string | null {
  const gap = goal - current;
  if (Math.abs(gap) < 0.05 || perWeek === 0 || Math.sign(gap) !== Math.sign(perWeek)) return null;
  return addDays(today, Math.round((gap / perWeek) * 7));
}
