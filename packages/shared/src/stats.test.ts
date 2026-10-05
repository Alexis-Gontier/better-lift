import { describe, expect, it } from "vitest";
import { semainesRecentes } from "./stats.js";

const PARIS = "Europe/Paris";
// Samedi 3 octobre 2026, 18 h à Paris : la semaine en cours commence le lundi 28 septembre.
const maintenant = new Date("2026-10-03T16:00:00.000Z");

describe("semainesRecentes (D112)", () => {
  it("rend les n dernières semaines, de la plus ancienne à la semaine en cours", () => {
    const s = semainesRecentes([], maintenant, PARIS, 3);
    expect(s.map((x) => x.lundi)).toEqual(["2026-09-14", "2026-09-21", "2026-09-28"]);
    expect(s.every((x) => x.seances === 0 && x.volumeKg === 0)).toBe(true);
    expect(s[0]?.jours).toEqual(Array(7).fill(false));
  });

  it("range chaque séance dans sa semaine et son jour, avec son volume", () => {
    const s = semainesRecentes(
      [
        { debut: "2026-09-22T17:00:00.000Z", volumeKg: 5000 }, // mardi 22
        { debut: "2026-09-24T17:00:00.000Z", volumeKg: 4000 }, // jeudi 24
        { debut: "2026-10-03T08:00:00.000Z", volumeKg: 7000 }, // samedi 3
        { debut: "2026-09-01T17:00:00.000Z", volumeKg: 9999 }, // hors fenêtre
      ],
      maintenant,
      PARIS,
      3,
    );
    expect(s.map((x) => [x.seances, x.volumeKg])).toEqual([
      [0, 0],
      [2, 9000],
      [1, 7000],
    ]);
    expect(s[1]?.jours).toEqual([false, true, false, true, false, false, false]);
    expect(s[2]?.jours[5]).toBe(true);
  });

  // 21 h 30 UTC le dimanche 27 septembre : 23 h 30 à Paris, toujours dimanche.
  it("découpe dans le fuseau : dimanche soir à Paris reste la semaine d'avant", () => {
    const s = semainesRecentes(
      [{ debut: "2026-09-27T21:30:00.000Z", volumeKg: 100 }],
      maintenant,
      PARIS,
      2,
    );
    expect(s[0]?.jours[6]).toBe(true);
    expect(s[1]?.seances).toBe(0);
  });
});
