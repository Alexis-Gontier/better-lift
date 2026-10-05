import { describe, expect, it } from "vitest";
import { apercuExercices, meilleureSerieComptee } from "./apercu.js";

const s = (reps: number | null, chargeKg: number | null, faite = true) =>
  ({ type: "NORMALE", reps, chargeKg, faite }) as const;

describe("meilleureSerieComptee (D119)", () => {
  it("garde la plus lourde, puis à charge égale la plus longue", () => {
    expect(meilleureSerieComptee([s(8, 80), s(5, 85), s(6, 85)])).toEqual({
      chargeKg: 85,
      reps: 6,
    });
  });

  it("ignore l'échauffement et les séries non faites", () => {
    expect(
      meilleureSerieComptee([
        { type: "ECHAUFFEMENT", reps: 10, chargeKg: 100, faite: true },
        s(5, 120, false),
        s(5, 80),
      ]),
    ).toEqual({ chargeKg: 80, reps: 5 });
  });

  it("au poids du corps, garde la plus longue ; une charge l'emporte sur le poids du corps", () => {
    expect(meilleureSerieComptee([s(8, null), s(12, null)])).toEqual({ chargeKg: null, reps: 12 });
    expect(meilleureSerieComptee([s(12, null), s(5, 10)])).toEqual({ chargeKg: 10, reps: 5 });
  });

  it("rend null sans série qui compte", () => {
    expect(meilleureSerieComptee([s(null, 80), s(5, 80, false)])).toBeNull();
  });
});

describe("apercuExercices (D119)", () => {
  const ex = (slug: string) => ({
    slug,
    nom: slug,
    image: null,
    series: [s(5, 80), s(5, 80, false)],
  });

  it("rend les trois premiers exercices, leurs séries faites et leur meilleure série", () => {
    const a = apercuExercices([ex("a"), ex("b"), ex("c"), ex("d")]);
    expect(a.map((e) => e.slug)).toEqual(["a", "b", "c"]);
    expect(a[0]).toEqual({
      slug: "a",
      nom: "a",
      image: null,
      nbSeries: 1,
      meilleure: { chargeKg: 80, reps: 5 },
    });
  });
});
