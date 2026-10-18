import { describe, expect, it } from "vitest";
import {
  addDays,
  dailyActivity,
  movingAverage,
  type SessionLike,
  startOfWeek,
  weeklyVolume,
  weekStreak,
} from "./stats";

const TODAY = "2026-10-16"; // vendredi

const s = (date: string, volume = 1000, minutes = 60): SessionLike => ({ date, volume, minutes });

describe("dates civiles", () => {
  it("ramène au lundi", () => {
    expect(startOfWeek("2026-10-16")).toBe("2026-10-12");
    expect(startOfWeek("2026-10-12")).toBe("2026-10-12");
    expect(startOfWeek("2026-10-18")).toBe("2026-10-12");
  });

  it("ajoute des jours en franchissant les mois", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("weeklyVolume", () => {
  it("rend N semaines, la plus ancienne d'abord, les vides à 0", () => {
    const sessions = [s("2026-10-13", 5000), s("2026-09-29", 2000)];
    expect(weeklyVolume(sessions, TODAY, 3)).toEqual([
      { week: "2026-09-28", volume: 2000 },
      { week: "2026-10-05", volume: 0 },
      { week: "2026-10-12", volume: 5000 },
    ]);
  });
});

describe("weekStreak", () => {
  it("compte les semaines consécutives, semaine en cours comprise", () => {
    const sessions = [s("2026-10-13"), s("2026-10-06"), s("2026-09-30"), s("2026-09-15")];
    expect(weekStreak(sessions, TODAY)).toBe(3);
  });

  it("part de la semaine précédente si la semaine en cours est vide", () => {
    const sessions = [s("2026-10-06"), s("2026-09-30")];
    expect(weekStreak(sessions, TODAY)).toBe(2);
  });

  it("vaut 0 sans séance récente", () => {
    expect(weekStreak([s("2026-08-01")], TODAY)).toBe(0);
  });
});

describe("dailyActivity", () => {
  it("rend un jour par date, niveau relatif au maximum", () => {
    const days = dailyActivity([s("2026-10-16", 4000), s("2026-10-14", 1000)], TODAY, 3);
    expect(days).toEqual([
      { date: "2026-10-14", count: 1, level: 1 },
      { date: "2026-10-15", count: 0, level: 0 },
      { date: "2026-10-16", count: 1, level: 4 },
    ]);
  });
});

describe("movingAverage", () => {
  it("moyenne les N dernières valeurs disponibles", () => {
    expect(movingAverage([2, 4, 6, 8], 2)).toEqual([2, 3, 5, 7]);
  });
});
