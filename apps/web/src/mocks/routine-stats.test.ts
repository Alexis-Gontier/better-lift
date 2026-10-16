import { describe, expect, it } from "vitest";
import { daysSince, estimateMinutes, groupSupersets, plannedVolume } from "./routine-stats";
import type { MockRoutineExercise } from "./routines";

const ex = (slug: string, superset?: string): MockRoutineExercise => ({
  slug,
  sets: [
    { kg: 50, reps: 10 },
    { kg: 60, reps: 8 },
  ],
  restSeconds: 90,
  superset,
});

describe("plannedVolume", () => {
  it("somme charge × répétitions de toutes les séries", () => {
    expect(plannedVolume([ex("a"), ex("b")])).toBe(2 * (500 + 480));
  });
});

describe("estimateMinutes", () => {
  it("compte 45 s d'effort plus le repos par série, arrondi à 5 min", () => {
    // 4 séries × (45 + 90) s = 540 s = 9 min → 10 min
    expect(estimateMinutes([ex("a"), ex("b")])).toBe(10);
  });
});

describe("groupSupersets", () => {
  it("regroupe les exercices consécutifs d'un même superset", () => {
    const groups = groupSupersets([ex("a"), ex("b", "A"), ex("c", "A"), ex("d")]);
    expect(groups.map((g) => g.map((e) => e.slug))).toEqual([["a"], ["b", "c"], ["d"]]);
  });
});

describe("daysSince", () => {
  it("compte les jours civils écoulés", () => {
    expect(daysSince("2026-10-09", "2026-10-16")).toBe(7);
    expect(daysSince("2026-10-16", "2026-10-16")).toBe(0);
  });
});
