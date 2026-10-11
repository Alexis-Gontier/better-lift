import { describe, expect, it } from "vitest";
import { progresExercices, type SeanceProgres } from "./progres.js";

const PARIS = "Europe/Paris";
// Samedi 3 octobre 2026, 18 h à Paris : « mois » = 4 semaines depuis le lundi 7 septembre.
const maintenant = new Date("2026-10-03T16:00:00.000Z");

const serie = (chargeKg: number, reps: number, faite = true) => ({
  type: "NORMALE" as const,
  chargeKg,
  reps,
  faite,
});

const seance = (
  debut: string,
  slug: string,
  series: ReturnType<typeof serie>[],
): SeanceProgres => ({
  debut,
  exercices: [{ slug, nom: slug.toUpperCase(), image: null, series }],
});

describe("progresExercices (D173)", () => {
  it("rend le 1RM du début et de la fin de la période, du plus récent au plus ancien", () => {
    const p = progresExercices(
      [
        seance("2026-09-08T17:00:00.000Z", "dc", [serie(100, 5)]),
        seance("2026-10-01T17:00:00.000Z", "dc", [serie(105, 5)]),
        seance("2026-09-20T17:00:00.000Z", "squat", [serie(140, 3)]),
      ],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p.map((e) => e.slug)).toEqual(["dc", "squat"]);
    expect(p[0]?.derniereFois).toBe("2026-10-01T17:00:00.000Z");
    expect(p[0]?.unRmDebut).toBeCloseTo(116.7, 1);
    expect(p[0]?.unRm).toBeCloseTo(122.5, 1);
    expect(p[1]?.unRm).toBe(p[1]?.unRmDebut);
  });

  it("ignore ce qui précède la période, découpée dans le fuseau", () => {
    const p = progresExercices(
      [
        // Dimanche 6 septembre, 23 h 30 à Paris : la semaine d'avant la période.
        seance("2026-09-06T21:30:00.000Z", "dc", [serie(200, 1)]),
        seance("2026-09-07T08:00:00.000Z", "dc", [serie(100, 5)]),
      ],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p[0]?.unRmDebut).toBeCloseTo(116.7, 1);
  });

  it("garde un exercice sans 1RM estimable (séries non faites, plus de 12 reps)", () => {
    const p = progresExercices(
      [seance("2026-10-01T17:00:00.000Z", "curl", [serie(20, 15), serie(30, 8, false)])],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p).toEqual([
      {
        slug: "curl",
        nom: "CURL",
        image: null,
        derniereFois: "2026-10-01T17:00:00.000Z",
        unRm: null,
        unRmDebut: null,
      },
    ]);
  });
});
