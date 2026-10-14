import { describe, expect, it } from "vitest";
import {
  avecCharge,
  debutPeriode,
  meilleuresParReps,
  pointsExercice,
  resumePeriode,
} from "./analyse-exercice.js";
import type { HistoriqueExercice } from "./records.js";

const PARIS = "Europe/Paris";
const t = (reps: number, chargeKg: number | null, type = "NORMALE" as const) => ({
  type,
  reps,
  chargeKg,
  faite: true,
});

// L'API rend l'historique du plus récent au plus ancien.
const historique: HistoriqueExercice = [
  {
    id: "c",
    nom: "Push",
    debut: "2026-10-07T16:28:00.000Z",
    series: [t(10, 40, "ECHAUFFEMENT" as never), t(6, 80), t(5, 80), { ...t(8, 90), faite: false }],
  },
  { id: "b", nom: "Push", debut: "2026-09-07T16:28:00.000Z", series: [t(6, 75), t(7, 75)] },
  { id: "a", nom: "Push", debut: "2026-06-01T16:28:00.000Z", series: [t(3, 70)] },
];

describe("debutPeriode", () => {
  it("recule de mois civils dans le fuseau", () => {
    // Le 1er octobre à 0 h 30 à Paris est encore le 30 septembre en UTC.
    expect(debutPeriode("3m", "2026-09-30T22:30:00.000Z", PARIS)).toBe("2026-07-01");
    expect(debutPeriode("1a", "2026-10-14T10:00:00.000Z", PARIS)).toBe("2025-10-14");
    expect(debutPeriode("tout", "2026-10-14T10:00:00.000Z", PARIS)).toBeNull();
  });
});

describe("pointsExercice", () => {
  it("donne un point par séance de la période, du plus ancien au plus récent", () => {
    const points = pointsExercice(historique, "3m", "2026-10-14T10:00:00.000Z", PARIS);
    expect(points.map((p) => p.date)).toEqual([
      "2026-09-07T16:28:00.000Z",
      "2026-10-07T16:28:00.000Z",
    ]);
  });

  it("exclut échauffements et séries non faites", () => {
    const dernier = pointsExercice(historique, "tout", "2026-10-14T10:00:00.000Z", PARIS).at(-1);
    expect(dernier).toEqual({
      date: "2026-10-07T16:28:00.000Z",
      chargeMax: 80,
      unRm: 96,
      volume: 880,
      reps: 11,
      series: 2,
    });
  });

  it("n'a ni charge ni 1RM au poids du corps", () => {
    const pdc: HistoriqueExercice = [
      {
        id: "x",
        nom: "Pompes",
        debut: "2026-10-01T10:00:00.000Z",
        series: [t(15, null), t(12, null)],
      },
    ];
    expect(pointsExercice(pdc, "tout", "2026-10-14T10:00:00.000Z", PARIS)).toEqual([
      {
        date: "2026-10-01T10:00:00.000Z",
        chargeMax: null,
        unRm: null,
        volume: 0,
        reps: 27,
        series: 2,
      },
    ]);
    expect(avecCharge(pdc)).toBe(false);
    expect(avecCharge(historique)).toBe(true);
  });
});

describe("resumePeriode", () => {
  it("additionne séances, séries, reps et volume", () => {
    const points = pointsExercice(historique, "tout", "2026-10-14T10:00:00.000Z", PARIS);
    expect(resumePeriode(points)).toEqual({
      seances: 3,
      series: 5,
      reps: 27,
      volume: 210 + 975 + 880,
      volumeMoyen: 688,
    });
  });

  it("rend des zéros sans séance", () => {
    expect(resumePeriode([])).toEqual({
      seances: 0,
      series: 0,
      reps: 0,
      volume: 0,
      volumeMoyen: 0,
    });
  });
});

describe("meilleuresParReps", () => {
  it("donne le réalisé exact et l'estimé, depuis toujours", () => {
    const lignes = meilleuresParReps(historique);
    expect(lignes.map((l) => l.reps)).toEqual([1, 3, 5, 6, 8, 10, 12]);
    // Meilleur 1RM : 80 × 6 → 96. Estimé à r reps : 96 / (1 + r/30), au 0,5 près.
    expect(lignes.find((l) => l.reps === 6)).toEqual({
      reps: 6,
      realise: { chargeKg: 80, date: "2026-10-07T16:28:00.000Z" },
      estimeKg: 80,
    });
    expect(lignes.find((l) => l.reps === 3)?.realise).toEqual({
      chargeKg: 70,
      date: "2026-06-01T16:28:00.000Z",
    });
    expect(lignes.find((l) => l.reps === 1)).toEqual({ reps: 1, realise: null, estimeKg: 96 });
    // La série de 7 reps compte dans le 1RM, mais ne crée pas de ligne.
    expect(lignes.some((l) => l.reps === 7)).toBe(false);
  });

  it("garde la date la plus ancienne à charge égale", () => {
    const egal: HistoriqueExercice = [
      { id: "2", nom: "P", debut: "2026-10-02T10:00:00.000Z", series: [t(5, 80)] },
      { id: "1", nom: "P", debut: "2026-10-01T10:00:00.000Z", series: [t(5, 80)] },
    ];
    expect(meilleuresParReps(egal).find((l) => l.reps === 5)?.realise?.date).toBe(
      "2026-10-01T10:00:00.000Z",
    );
  });

  it("n'estime rien au poids du corps", () => {
    const pdc: HistoriqueExercice = [
      { id: "x", nom: "Pompes", debut: "2026-10-01T10:00:00.000Z", series: [t(12, null)] },
    ];
    expect(meilleuresParReps(pdc).every((l) => l.estimeKg === null && l.realise === null)).toBe(
      true,
    );
  });
});
