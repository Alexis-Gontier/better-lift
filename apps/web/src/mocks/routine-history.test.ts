import { describe, expect, it } from "vitest";
import { routineLifts, routineRuns, runFrequency } from "./routine-history";
import type { MockRoutine } from "./routines";

const routine: MockRoutine = {
  id: "1",
  name: "Push",
  folder: "",
  lastDone: null,
  exercises: [
    {
      slug: "bench",
      restSeconds: 90,
      sets: [
        { kg: null, reps: 10, type: "warmup" },
        { kg: 80, reps: 5 },
        { kg: 80, reps: 5 },
      ],
    },
    { slug: "fly", restSeconds: 60, sets: [{ kg: 20, reps: 12 }] },
  ],
};

const run = (id: string, date: string, routineName: string, bench: [number, number][]) => ({
  session: { id, date, routine: routineName, minutes: 50, volume: 1000, records: 1 },
  exercises: [{ slug: "bench", sets: bench.map(([kg, reps]) => ({ kg, reps })) }],
});

const details = [
  run("c", "2026-10-15", "Push", [
    [85, 5],
    [85, 5],
  ]),
  run("x", "2026-10-10", "Pull", [[50, 5]]),
  run("a", "2026-10-01", "Push", [[80, 5]]),
];

describe("routineRuns", () => {
  it("garde les séances de la routine, dans l'ordre chronologique, avec leur réalisation", () => {
    const runs = routineRuns(routine, details);
    expect(runs.map((r) => r.id)).toEqual(["a", "c"]);
    // 3 séries prévues hors échauffement ; 1 puis 2 faites.
    expect(runs.map((r) => r.completion)).toEqual([1 / 3, 2 / 3]);
  });
});

describe("runFrequency", () => {
  it("compte les séances et l'intervalle moyen", () => {
    expect(runFrequency(routineRuns(routine, details))).toEqual({ count: 2, avgGapDays: 14 });
  });
  it("pas d'intervalle sous deux séances", () => {
    expect(runFrequency([])).toEqual({ count: 0, avgGapDays: null });
  });
});

describe("routineLifts", () => {
  it("suit la meilleure série de chaque exercice d'une séance à l'autre", () => {
    const [bench, fly] = routineLifts(routine, details);
    expect(bench?.points.map((p) => p.date)).toEqual(["2026-10-01", "2026-10-15"]);
    expect(bench?.change).toBeCloseTo(6.3, 1);
    expect(fly).toEqual({ slug: "fly", points: [], change: null });
  });
});
