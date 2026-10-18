import type { HistoriqueExercice } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import {
  chiffresSeance,
  chronologique,
  meilleureChargeParReps,
  pourcentagesUnRm,
  recordsExercice,
} from "./stats";

type Serie = HistoriqueExercice[number]["series"][number];
const s = (chargeKg: number | null, reps: number, extra: Partial<Serie> = {}): Serie => ({
  type: "NORMALE",
  chargeKg,
  reps,
  faite: true,
  ...extra,
});
const seance = (debut: string, series: Serie[]) => ({ id: debut, nom: "Push", debut, series });

// Comme l'API : la plus récente d'abord.
const historique: HistoriqueExercice = [
  seance("2026-10-08T17:00:00.000Z", [s(105, 3), s(90, 10)]),
  seance("2026-10-01T17:00:00.000Z", [s(40, 10, { type: "ECHAUFFEMENT" }), s(100, 5), s(100, 5)]),
];

describe("chronologique", () => {
  it("remet les séances dans l'ordre du temps", () => {
    expect(chronologique(historique).map((x) => x.debut)).toEqual([
      "2026-10-01T17:00:00.000Z",
      "2026-10-08T17:00:00.000Z",
    ]);
  });
});

describe("recordsExercice", () => {
  it("rend les records de shared, datés de la séance qui les a établis", () => {
    const r = new Map(recordsExercice(historique).map((x) => [x.type, x]));
    expect(r.get("CHARGE")).toMatchObject({ valeur: 105, date: "2026-10-08T17:00:00.000Z" });
    // 90 × (1 + 10/30) = 120 bat 105 × 1,1 = 115,5 et 100 × (1 + 5/30) = 116,7.
    expect(r.get("UN_RM")).toMatchObject({ valeur: 120, date: "2026-10-08T17:00:00.000Z" });
    expect(r.get("VOLUME")).toMatchObject({ valeur: 900 });
  });
});

describe("chiffresSeance", () => {
  it("volume, meilleure charge et 1RM, hors échauffement et séries non faites", () => {
    const premiere = historique[1];
    if (!premiere) throw new Error("historique incomplet");
    expect(chiffresSeance(premiere)).toEqual({ volume: 1000, charge: 100, unRm: 116.7 });
    expect(chiffresSeance(seance("x", [s(80, 5, { faite: false })]))).toEqual({
      volume: 0,
      charge: null,
      unRm: null,
    });
  });
});

describe("meilleureChargeParReps", () => {
  it("garde la plus lourde charge faite pour chaque nombre de répétitions", () => {
    const m = meilleureChargeParReps(historique);
    expect(m.get(5)).toBe(100);
    expect(m.get(10)).toBe(90);
    expect(m.get(3)).toBe(105);
    expect(m.has(8)).toBe(false);
  });
});

describe("pourcentagesUnRm", () => {
  it("rend la charge de 100 % à 50 %, par paliers de 5, arrondie à 2,5 kg", () => {
    const rows = pourcentagesUnRm(100);
    expect(rows[0]).toEqual({ percent: 100, kg: 100 });
    expect(rows.at(-1)).toEqual({ percent: 50, kg: 50 });
    // 118 × 0,9 = 106,2 : le palier de 2,5 kg le plus proche est 105.
    expect(pourcentagesUnRm(118).find((r) => r.percent === 90)?.kg).toBe(105);
  });
});
