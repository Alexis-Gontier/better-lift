import { describe, expect, it } from "vitest";
import {
  comparedPeriods,
  dailyActivity,
  goalStreak,
  sessionsByRoutine,
  type Week,
  weeklyTotals,
  weekStart,
} from "./dashboard";
import type { MockSession } from "./sessions";

const s = (date: string, routine = "Push", volume = 1000, records = 0): MockSession => ({
  id: `${date}-${routine}`,
  date,
  routine,
  minutes: 50,
  volume,
  records,
});

describe("semaine", () => {
  it("commence le lundi, dimanche compris dans la semaine qui finit", () => {
    expect(weekStart("2026-10-16")).toBe("2026-10-12"); // vendredi
    expect(weekStart("2026-10-12")).toBe("2026-10-12"); // lundi
    expect(weekStart("2026-10-18")).toBe("2026-10-12"); // dimanche
  });

  it("additionne chaque semaine, la plus ancienne d'abord", () => {
    const weeks = weeklyTotals(
      [s("2026-10-05"), s("2026-10-13"), s("2026-10-16")],
      "2026-10-16",
      2,
    );
    expect(weeks.map((w) => [w.start, w.count])).toEqual([
      ["2026-10-05", 1],
      ["2026-10-12", 2],
    ]);
  });
});

describe("périodes comparées", () => {
  it("met la période en regard de celle d'avant, de même durée", () => {
    const { now, before } = comparedPeriods(
      [s("2026-10-16", "Push", 2000, 1), s("2026-10-03"), s("2026-10-02"), s("2026-09-01")],
      "2026-10-16",
      14,
    );
    expect(now).toMatchObject({ count: 2, volume: 3000, records: 1 }); // 3 → 16 oct.
    expect(before).toMatchObject({ count: 1 }); // 19 sept. → 2 oct.
  });
});

describe("calendrier", () => {
  it("a une case par jour, du lundi d'il y a N semaines à aujourd'hui", () => {
    const days = dailyActivity([], "2026-10-16", 2);
    expect(days.at(0)?.date).toBe("2026-10-05");
    expect(days.at(-1)?.date).toBe("2026-10-16");
    expect(days).toHaveLength(12);
  });

  it("gradue le volume en quartiles, 0 les jours sans séance", () => {
    const days = dailyActivity(
      [s("2026-10-13", "A", 1000), s("2026-10-14", "A", 2000), s("2026-10-16", "A", 9000)],
      "2026-10-16",
      1,
    );
    const level = (date: string) => days.find((d) => d.date === date)?.level;
    expect(level("2026-10-12")).toBe(0);
    expect(level("2026-10-13")).toBe(1);
    expect(level("2026-10-16")).toBe(4);
  });
});

describe("routines", () => {
  it("compte les séances depuis la date, la plus faite d'abord", () => {
    const by = sessionsByRoutine(
      [
        s("2026-10-01", "Pull"),
        s("2026-10-02", "Push"),
        s("2026-10-03", "Push"),
        s("2026-01-01", "Legs"),
      ],
      "2026-09-01",
    );
    expect(by).toEqual([
      { routine: "Push", count: 2 },
      { routine: "Pull", count: 1 },
    ]);
  });
});

describe("série à l'objectif", () => {
  const weeks = (...counts: number[]): Week[] =>
    counts.map((count) => ({ start: "", count, volume: 0, records: 0, minutes: 0 }));

  it("remonte les semaines atteintes jusqu'à la première manquée", () => {
    expect(goalStreak(weeks(3, 1, 3, 4, 3), 3)).toBe(3);
  });

  it("ne casse pas sur la semaine en cours, pas finie", () => {
    expect(goalStreak(weeks(3, 3, 1), 3)).toBe(2);
  });
});
