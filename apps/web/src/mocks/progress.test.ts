import { describe, expect, it } from "vitest";
import {
  inPeriod,
  periodFigures,
  periodStart,
  previousRange,
  setsPerMuscle,
  strengthTrend,
  weeklySeries,
} from "./progress";

const TODAY = "2026-10-16";

describe("periodStart", () => {
  it("recule de la durée de la période", () => {
    expect(periodStart("4s", TODAY)).toBe("2026-09-18");
    expect(periodStart("1a", TODAY)).toBe("2025-10-17");
  });

  it("filtre les séances de la période", () => {
    const sessions = [{ date: "2026-10-01" }, { date: "2026-09-01" }];
    expect(inPeriod(sessions, "4s", TODAY)).toEqual([{ date: "2026-10-01" }]);
  });

  it("donne la période de même longueur juste avant", () => {
    expect(previousRange("4s", TODAY)).toEqual({ from: "2026-08-21", to: "2026-09-17" });
  });
});

describe("periodFigures", () => {
  it("rapporte séances et volume à la semaine, moyenne la durée, somme les records", () => {
    const sessions = [
      { date: "2026-10-13", minutes: 60, volume: 4000, records: 1 },
      { date: "2026-10-01", minutes: 40, volume: 2000, records: 0 },
      { date: "2026-08-01", minutes: 90, volume: 9000, records: 3 },
    ];
    expect(periodFigures(sessions, "2026-09-18", TODAY, 4)).toEqual({
      count: 2,
      perWeek: 0.5,
      volumePerWeek: 1500,
      avgMinutes: 50,
      records: 1,
    });
  });
});

describe("setsPerMuscle", () => {
  it("compte les séries par semaine et par muscle principal", () => {
    const details = [
      {
        exercises: [
          { muscle: "Pectoraux", sets: 6 },
          { muscle: "Triceps", sets: 3 },
        ],
      },
      { exercises: [{ muscle: "Pectoraux", sets: 4 }] },
    ];
    expect(setsPerMuscle(details, 2)).toEqual([
      { muscle: "Pectoraux", perWeek: 5 },
      { muscle: "Triceps", perWeek: 1.5 },
    ]);
  });
});

describe("strengthTrend", () => {
  it("donne l'écart en % entre la première et la dernière séance chargée", () => {
    const trend = strengthTrend([
      { date: "a", value: 0 },
      { date: "b", value: 80 },
      { date: "c", value: 88 },
    ]);
    expect(trend?.change).toBe(10);
    expect(trend?.last).toBe(88);
    expect(trend?.points).toHaveLength(2);
  });

  it("ne dit rien avec moins de deux séances chargées", () => {
    expect(strengthTrend([{ date: "a", value: 50 }])).toBeNull();
  });
});

describe("weeklySeries", () => {
  it("compte les séances et moyenne la durée par semaine, semaines vides comprises", () => {
    const sessions = [
      { date: "2026-10-13", minutes: 60 },
      { date: "2026-10-15", minutes: 80 },
      { date: "2026-09-30", minutes: 50 },
    ];
    expect(weeklySeries(sessions, TODAY, 3)).toEqual([
      { week: "2026-09-28", count: 1, minutes: 50 },
      { week: "2026-10-05", count: 0, minutes: 0 },
      { week: "2026-10-12", count: 2, minutes: 70 },
    ]);
  });
});
