import { describe, expect, it } from "vitest";
import { courbeUnRm, ecartSerie } from "./ecart.js";

describe("ecartSerie (D123)", () => {
  const s = (chargeKg: number | null, reps: number | null) => ({ chargeKg, reps });

  it("dit l'écart de charge d'abord, en hausse comme en baisse", () => {
    expect(ecartSerie(s(82.5, 5), s(80, 6))).toEqual({ genre: "charge", deltaKg: 2.5 });
    expect(ecartSerie(s(77.5, 8), s(80, 8))).toEqual({ genre: "charge", deltaKg: -2.5 });
  });

  it("à charge égale, l'écart de répétitions, puis l'égalité", () => {
    expect(ecartSerie(s(80, 7), s(80, 6))).toEqual({ genre: "reps", delta: 1 });
    expect(ecartSerie(s(80, 6), s(80, 6))).toEqual({ genre: "egal" });
  });

  it("au poids du corps, compare les répétitions", () => {
    expect(ecartSerie(s(null, 10), s(null, 12))).toEqual({ genre: "reps", delta: -2 });
  });

  it("rend null sans précédente ou sans répétitions", () => {
    expect(ecartSerie(s(80, 5), undefined)).toBeNull();
    expect(ecartSerie(s(80, null), s(80, 5))).toBeNull();
  });
});

describe("courbeUnRm (D124)", () => {
  const serie = (chargeKg: number | null, reps: number, faite = true) =>
    ({ type: "NORMALE", chargeKg, reps, faite }) as const;

  it("garde le meilleur 1RM estimé de chaque séance, dans l'ordre chronologique", () => {
    const c = courbeUnRm([
      { debut: "2026-10-03T17:00:00.000Z", series: [serie(85, 5), serie(80, 8)] },
      { debut: "2026-09-26T17:00:00.000Z", series: [serie(80, 5)] },
    ]);
    expect(c).toEqual([
      { date: "2026-09-26T17:00:00.000Z", valeur: 93.3 },
      { date: "2026-10-03T17:00:00.000Z", valeur: 101.3 },
    ]);
  });

  it("omet l'échauffement, les séries non faites, le poids du corps et plus de 12 reps", () => {
    const c = courbeUnRm([
      {
        debut: "2026-10-03T17:00:00.000Z",
        series: [
          { type: "ECHAUFFEMENT", chargeKg: 100, reps: 5, faite: true },
          serie(120, 5, false),
          serie(null, 12),
          serie(82.5, 56),
        ],
      },
    ]);
    expect(c).toEqual([]);
  });
});
