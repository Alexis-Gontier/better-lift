import { describe, expect, it } from "vitest";

import {
  addDays,
  civilDate,
  daysBetween,
  eachDay,
  eachPeriodStart,
  rangeWindow,
  startOfMonth,
  startOfWeek,
  weekStreak,
  zonedDayEnd,
  zonedDayStart,
} from "./calendar.js";

describe("civilDate", () => {
  it("should return the civil day of the profile timezone, not the UTC one", () => {
    /**
     * Le cas qui motive tout ce fichier : une séance du samedi 21 h à Paris est
     * déjà dimanche en UTC pendant l'heure d'été. Rangée en UTC, elle casse la
     * série de semaines sans que rien ne le signale.
     */
    const saturdayEvening = new Date("2026-07-11T21:30:00Z");

    expect(civilDate(saturdayEvening, "UTC")).toBe("2026-07-11");
    expect(civilDate(new Date("2026-07-11T23:30:00Z"), "Europe/Paris")).toBe("2026-07-12");
    expect(civilDate(saturdayEvening, "Europe/Paris")).toBe("2026-07-11");
  });

  it("should place an instant on the previous day west of Greenwich", () => {
    expect(civilDate(new Date("2026-03-02T03:00:00Z"), "America/New_York")).toBe("2026-03-01");
  });

  it("should pad months and days", () => {
    expect(civilDate(new Date("2026-01-05T12:00:00Z"), "UTC")).toBe("2026-01-05");
  });
});

describe("zonedDayStart", () => {
  it("should resolve midnight of the zone, not of UTC", () => {
    expect(zonedDayStart("2026-07-12", "Europe/Paris").toISOString()).toBe(
      "2026-07-11T22:00:00.000Z",
    );
    expect(zonedDayStart("2026-01-12", "Europe/Paris").toISOString()).toBe(
      "2026-01-11T23:00:00.000Z",
    );
    expect(zonedDayStart("2026-07-12", "UTC").toISOString()).toBe("2026-07-12T00:00:00.000Z");
  });

  /**
   * Le jour du passage à l'heure d'été, minuit reste minuit mais le décalage
   * change quelques heures plus tard : c'est le cas où une estimation en une
   * seule passe tombe du mauvais côté.
   */
  it("should stay correct on daylight saving transition days", () => {
    expect(zonedDayStart("2026-03-29", "Europe/Paris").toISOString()).toBe(
      "2026-03-28T23:00:00.000Z",
    );
    expect(zonedDayStart("2026-03-30", "Europe/Paris").toISOString()).toBe(
      "2026-03-29T22:00:00.000Z",
    );
  });

  it("should give a day window that contains exactly its own instants", () => {
    const start = zonedDayStart("2026-03-29", "Europe/Paris");
    const end = zonedDayEnd("2026-03-29", "Europe/Paris");

    // 23 h ce jour-là, pas 24 : c'est le propre du passage à l'heure d'été.
    expect(end.getTime() - start.getTime()).toBe(23 * 3_600_000);
    expect(civilDate(start, "Europe/Paris")).toBe("2026-03-29");
    expect(civilDate(new Date(end.getTime() - 1), "Europe/Paris")).toBe("2026-03-29");
    expect(civilDate(end, "Europe/Paris")).toBe("2026-03-30");
  });
});

describe("addDays / daysBetween", () => {
  it("should cross month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("should count whole civil days even across a DST change", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
    expect(daysBetween("2026-05-10", "2026-05-10")).toBe(0);
  });
});

describe("startOfWeek", () => {
  it("should return the monday of the ISO week", () => {
    // 2026-07-15 est un mercredi.
    expect(startOfWeek("2026-07-15")).toBe("2026-07-13");
    expect(startOfWeek("2026-07-13")).toBe("2026-07-13");
  });

  it("should keep sunday in the week that started the monday before", () => {
    // Le piège de la semaine américaine : dimanche ne commence pas la semaine.
    expect(startOfWeek("2026-07-19")).toBe("2026-07-13");
  });
});

describe("startOfMonth", () => {
  it("should return the first day of the month", () => {
    expect(startOfMonth("2026-07-31")).toBe("2026-07-01");
    expect(startOfMonth("2026-01-01")).toBe("2026-01-01");
  });
});

describe("eachDay", () => {
  it("should include both bounds", () => {
    expect(eachDay("2026-07-13", "2026-07-16")).toEqual([
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
    ]);
  });

  it("should return a single day when bounds are equal", () => {
    expect(eachDay("2026-07-13", "2026-07-13")).toEqual(["2026-07-13"]);
  });
});

describe("eachPeriodStart", () => {
  /**
   * Le cœur du contrat : les périodes sans séance sont présentes. Un graphique
   * qui les saute ment sur le rythme, et c'est justement la coupure
   * involontaire qu'on cherche à voir.
   */
  it("should emit every week including the empty ones", () => {
    expect(eachPeriodStart("2026-07-15", "2026-08-05", "week")).toEqual([
      "2026-07-13",
      "2026-07-20",
      "2026-07-27",
      "2026-08-03",
    ]);
  });

  it("should emit every month including the short ones", () => {
    expect(eachPeriodStart("2026-01-15", "2026-04-02", "month")).toEqual([
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
      "2026-04-01",
    ]);
  });

  it("should cross a year boundary", () => {
    expect(eachPeriodStart("2026-11-10", "2027-01-05", "month")).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2027-01-01",
    ]);
  });

  it("should return a single period when both bounds share it", () => {
    expect(eachPeriodStart("2026-07-14", "2026-07-16", "week")).toEqual(["2026-07-13"]);
  });
});

describe("rangeWindow", () => {
  it("should count today inside the window", () => {
    // 7 jours du 9 au 15 inclus, pas du 8 au 15 : sinon la fenêtre en fait 8.
    expect(rangeWindow("7d", "2026-07-15")).toEqual({
      fromDay: "2026-07-09",
      toDay: "2026-07-15",
      previousFromDay: "2026-07-02",
      previousToDay: "2026-07-08",
    });
  });

  it("should make the previous period the same length and adjacent", () => {
    const window = rangeWindow("30d", "2026-07-15");

    expect(daysBetween(window.fromDay ?? "", window.toDay)).toBe(29);
    expect(daysBetween(window.previousFromDay ?? "", window.previousToDay ?? "")).toBe(29);
    expect(addDays(window.previousToDay ?? "", 1)).toBe(window.fromDay);
  });

  it("should leave a year window at 365 days", () => {
    expect(rangeWindow("1y", "2026-07-15").fromDay).toBe("2025-07-16");
  });

  /**
   * `all` n'a pas de précédent : il n'existe rien avant l'inscription, et des
   * zéros feraient afficher une chute de 100 %.
   */
  it("should return no bounds and no previous period for all", () => {
    expect(rangeWindow("all", "2026-07-15")).toEqual({
      fromDay: null,
      toDay: "2026-07-15",
      previousFromDay: null,
      previousToDay: null,
    });
  });
});

describe("weekStreak", () => {
  const current = "2026-07-13";

  it("should count consecutive weeks back from the current one", () => {
    const weeks = new Set(["2026-07-13", "2026-07-06", "2026-06-29"]);

    expect(weekStreak(weeks, current)).toEqual({ currentWeeks: 3, longestWeeks: 3 });
  });

  /**
   * La semaine en cours n'est pas finie : la compter comme un échec ferait
   * tomber la série de tout le monde le lundi matin.
   */
  it("should not break the streak when the current week has no workout yet", () => {
    const weeks = new Set(["2026-07-06", "2026-06-29"]);

    expect(weekStreak(weeks, current)).toEqual({ currentWeeks: 2, longestWeeks: 2 });
  });

  it("should stop at the first missed week", () => {
    const weeks = new Set(["2026-07-06", "2026-06-22"]);

    expect(weekStreak(weeks, current).currentWeeks).toBe(1);
  });

  it("should report the longest past run even when it is over", () => {
    const weeks = new Set([
      "2026-05-04",
      "2026-05-11",
      "2026-05-18",
      "2026-05-25",
      // trou
      "2026-07-06",
    ]);

    expect(weekStreak(weeks, current)).toEqual({ currentWeeks: 1, longestWeeks: 4 });
  });

  it("should return zeros without any workout", () => {
    expect(weekStreak(new Set(), current)).toEqual({ currentWeeks: 0, longestWeeks: 0 });
  });
});
