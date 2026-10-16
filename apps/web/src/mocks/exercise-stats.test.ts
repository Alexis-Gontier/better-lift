import { describe, expect, it } from "vitest";
import {
  bestByReps,
  estimate1rm,
  oneRmPercentages,
  type Performance,
  records,
} from "./exercise-stats";

const perf = (date: string, sets: [number, number][]): Performance => ({
  date,
  sessionId: date,
  sets: sets.map(([kg, reps]) => ({ kg, reps })),
});

describe("estimate1rm", () => {
  it("applique Epley : charge × (1 + répétitions / 30)", () => {
    expect(estimate1rm(100, 5)).toBeCloseTo(116.67, 2);
  });

  it("une répétition vaut la charge elle-même", () => {
    expect(estimate1rm(120, 1)).toBe(120);
  });
});

describe("records", () => {
  const history = [
    perf("2026-10-01", [
      [100, 5],
      [100, 5],
    ]),
    perf("2026-10-08", [
      [105, 3],
      [90, 10],
    ]),
  ];

  it("trouve la meilleure charge, le meilleur 1RM estimé et le meilleur volume", () => {
    const r = records(history);
    expect(r.heaviest).toEqual({ value: 105, date: "2026-10-08" });
    expect(r.best1rm.date).toBe("2026-10-08");
    expect(r.best1rm.value).toBeCloseTo(120, 0);
    expect(r.bestVolume).toEqual({ value: 1215, date: "2026-10-08" });
  });
});

describe("bestByReps", () => {
  it("garde la plus lourde charge faite pour chaque nombre de répétitions", () => {
    const best = bestByReps([
      perf("2026-10-01", [
        [100, 5],
        [110, 5],
        [90, 10],
      ]),
    ]);
    expect(best.get(5)).toBe(110);
    expect(best.get(10)).toBe(90);
    expect(best.has(8)).toBe(false);
  });
});

describe("oneRmPercentages", () => {
  it("rend la charge de 100 % à 50 %, par paliers de 5, arrondie à 2,5 kg", () => {
    const rows = oneRmPercentages(100);
    expect(rows[0]).toEqual({ percent: 100, kg: 100 });
    expect(rows.at(-1)).toEqual({ percent: 50, kg: 50 });
    expect(rows.find((r) => r.percent === 85)?.kg).toBe(85);
    // 118 × 0,9 = 106,2 : le palier de 2,5 kg le plus proche est 105.
    expect(oneRmPercentages(118).find((r) => r.percent === 90)?.kg).toBe(105);
  });
});
