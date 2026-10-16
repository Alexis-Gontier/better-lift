import { describe, expect, it } from "vitest";
import { averageDelta } from "./body";

describe("averageDelta", () => {
  it("compare la moyenne sur 7 jours d'aujourd'hui à celle d'il y a N jours", () => {
    // 14 pesées : 80 kg la première semaine, 79 kg la seconde.
    const weights = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      kg: i < 7 ? 80 : 79,
    }));
    expect(averageDelta(weights, 7)).toBeCloseTo(-1, 5);
  });

  it("vaut 0 sans assez d'historique", () => {
    expect(averageDelta([{ date: "2026-10-01", kg: 80 }], 7)).toBe(0);
  });
});
