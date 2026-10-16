import { describe, expect, it } from "vitest";
import { inPeriod, muscleStats, periodStart, weeklySeries } from "./progress";

const TODAY = "2026-10-16";

describe("periodStart", () => {
  it("recule de la durée de la période", () => {
    expect(periodStart("4s", TODAY)).toBe("2026-09-18");
    expect(periodStart("3m", TODAY)).toBe("2026-07-18");
    expect(periodStart("1a", TODAY)).toBe("2025-10-16");
    expect(periodStart("tout", TODAY)).toBe("0000-01-01");
  });

  it("filtre les séances de la période", () => {
    const sessions = [{ date: "2026-10-01" }, { date: "2026-09-01" }];
    expect(inPeriod(sessions, "4s", TODAY)).toEqual([{ date: "2026-10-01" }]);
  });
});

describe("muscleStats", () => {
  it("somme le volume et compte les séances par muscle principal", () => {
    const details = [
      {
        exercises: [
          { muscle: "Pectoraux", volume: 1000 },
          { muscle: "Triceps", volume: 300 },
        ],
      },
      {
        exercises: [
          { muscle: "Pectoraux", volume: 500 },
          { muscle: "Pectoraux", volume: 200 },
        ],
      },
    ];
    expect(muscleStats(details, 2)).toEqual([
      { muscle: "Pectoraux", volume: 1700, sessions: 2, perWeek: 1 },
      { muscle: "Triceps", volume: 300, sessions: 1, perWeek: 0.5 },
    ]);
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
