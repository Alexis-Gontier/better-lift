import { describe, expect, it } from "vitest";
import { marquerRecords, recordsDe, type SerieHisto } from "./records.js";

const n = (
  reps: number,
  chargeKg: number | null,
  type: SerieHisto["type"] = "NORMALE",
): SerieHisto => ({
  type,
  reps,
  chargeKg,
  faite: true,
});
const date = "2026-09-20T18:00:00.000Z";
const avecDate = (s: SerieHisto, d = date) => ({ ...s, date: d });

describe("recordsDe", () => {
  it("ignore l'échauffement, les séries non faites et les séries à zéro rep", () => {
    expect(
      recordsDe([
        avecDate(n(10, 100, "ECHAUFFEMENT")),
        avecDate({ ...n(5, 120), faite: false }),
        avecDate(n(0, 140)),
      ]),
    ).toEqual([]);
  });

  it("rend charge max, 1RM estimé et meilleure série en volume", () => {
    const r = recordsDe([avecDate(n(8, 80)), avecDate(n(5, 85)), avecDate(n(6, 80))]);
    expect(r).toEqual([
      { type: "CHARGE", valeur: 85, reps: 5, chargeKg: 85, date },
      // Epley : 80 × (1 + 8/30) = 101,3 — au-dessus de 85 × 5 (99,2).
      { type: "UN_RM", valeur: 101.3, reps: 8, chargeKg: 80, date },
      { type: "VOLUME", valeur: 640, reps: 8, chargeKg: 80, date },
    ]);
  });

  // À charge égale, la série avec le plus de reps est le record.
  it("départage la charge max par le nombre de reps", () => {
    const r = recordsDe([avecDate(n(3, 100)), avecDate(n(5, 100))]);
    expect(r.find((x) => x.type === "CHARGE")).toMatchObject({ valeur: 100, reps: 5 });
  });

  it("au poids du corps, seul le maximum de reps compte", () => {
    expect(recordsDe([avecDate(n(8, null)), avecDate(n(12, null))])).toEqual([
      { type: "REPS", valeur: 12, reps: 12, chargeKg: null, date },
    ]);
  });

  it("garde la date du record, et la première en cas d'égalité", () => {
    const r = recordsDe([
      avecDate(n(5, 100), "2026-09-01T10:00:00.000Z"),
      avecDate(n(5, 100), "2026-09-10T10:00:00.000Z"),
    ]);
    expect(r.find((x) => x.type === "CHARGE")?.date).toBe("2026-09-01T10:00:00.000Z");
  });
});

describe("marquerRecords", () => {
  it("une première séance marque ce qui établit un record, série après série", () => {
    expect(marquerRecords([], [n(8, 80), n(5, 85), n(6, 80)])).toEqual([
      ["CHARGE", "UN_RM", "VOLUME"],
      // 85 bat la charge, pas le 1RM (99,2 < 101,3) ni le volume (425 < 640).
      ["CHARGE"],
      [],
    ]);
  });

  // D64 : le badge dit ce qui a été battu À CE MOMENT-LÀ, contre l'historique antérieur.
  it("compare à l'historique antérieur, et une égalité ne bat rien", () => {
    const avant = recordsDe([avecDate(n(5, 100))]);
    expect(marquerRecords(avant, [n(5, 100), n(6, 100), n(3, 105)])).toEqual([
      [],
      ["CHARGE", "UN_RM", "VOLUME"],
      ["CHARGE"],
    ]);
  });

  it("ne marque ni l'échauffement ni une série non faite", () => {
    expect(
      marquerRecords([], [n(10, 200, "ECHAUFFEMENT"), { ...n(5, 200), faite: false }]),
    ).toEqual([[], []]);
  });

  it("au poids du corps, marque les reps", () => {
    expect(marquerRecords(recordsDe([avecDate(n(10, null))]), [n(9, null), n(11, null)])).toEqual([
      [],
      ["REPS"],
    ]);
  });
});

describe("le 1RM estimé", () => {
  // Epley n'a plus de sens au-delà d'une douzaine de reps : 56 × 82,5 donnerait
  // 236,5 kg. Une telle série compte pour la charge et le volume, pas le 1RM.
  it("n'est pas estimé au-delà de 12 reps", () => {
    const r = recordsDe([avecDate(n(56, 82.5))]);
    expect(r.map((x) => x.type)).toEqual(["CHARGE", "VOLUME"]);
    expect(marquerRecords([], [n(13, 50)])).toEqual([["CHARGE", "VOLUME"]]);
  });
});
