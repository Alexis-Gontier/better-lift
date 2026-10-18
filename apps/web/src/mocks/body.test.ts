import { describe, expect, it } from "vitest";
import { averageDelta, goalEta, relativeStrength, weightAt } from "./body";

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

describe("goalEta", () => {
  it("projette la date au rythme actuel", () => {
    // 2 kg à perdre à 0,5 kg par semaine : 4 semaines.
    expect(goalEta(80, 78, -0.5, "2026-10-16")).toBe("2026-11-13");
  });

  it("ne dit rien si l'on s'éloigne de l'objectif, ou s'il est atteint", () => {
    expect(goalEta(80, 78, 0.3, "2026-10-16")).toBeNull();
    expect(goalEta(78, 78, -0.3, "2026-10-16")).toBeNull();
  });
});
describe("relativeStrength", () => {
  it("rapporte le 1RM au poids de corps, à deux décimales", () => {
    expect(relativeStrength(92, 80)).toBe(1.15);
    expect(relativeStrength(92, 0)).toBe(0);
  });
});

describe("weightAt", () => {
  const weights = [
    { date: "2026-10-01", kg: 80 },
    { date: "2026-10-02", kg: 82 },
    { date: "2026-10-10", kg: 90 },
  ];
  it("moyenne les sept dernières pesées jusqu'à la date", () => {
    expect(weightAt(weights, "2026-10-05")).toBe(81);
  });
  it("rien avant la première pesée", () => {
    expect(weightAt(weights, "2026-09-01")).toBeNull();
  });
});
