import { seeded } from "./random";
import { addDays } from "./stats";
import { TODAY } from "./today";

export type MockWeight = { date: string; kg: number };

/** 90 pesées quotidiennes, de ~82 à ~79,5 kg, avec le bruit d'une vraie balance. */
export const mockWeights: MockWeight[] = (() => {
  const rand = seeded(7);
  return Array.from({ length: 90 }, (_, i) => ({
    date: addDays(TODAY, i - 89),
    kg: Math.round((82 - (i / 89) * 2.5 + (rand() - 0.5) * 1.2) * 10) / 10,
  }));
})();
