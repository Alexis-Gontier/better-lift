import { describe, expect, it } from "vitest";
import {
  calculerPeriode,
  joursDeLaSemaine,
  niveauxCalendrier,
  type SeancePeriode,
  semainesALire,
  semainesRecentes,
  semainesTenues,
} from "./stats.js";

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

describe("calculerPeriode (D125, D185–D188)", () => {
  // Samedi 3 octobre 2026 : la semaine en cours commence le lundi 28 septembre ;
  // « mois » = 4 semaines depuis le lundi 7 septembre, comparées aux 4 d'avant.
  const seance = (id: string, debut: string, volumeKg = 1000): SeancePeriode => ({
    id,
    debut,
    fin: new Date(Date.parse(debut) + 45 * 60_000).toISOString(),
    volumeKg,
    seriesFaites: 10,
    exercices: [
      { musclePrincipal: "Pectoraux", musclesSecondaires: ["Triceps"], seriesComptees: 4 },
      { musclePrincipal: "Triceps", musclesSecondaires: [], seriesComptees: 3 },
    ],
  });

  it("compte la période, la précédente au même moment, et ignore le reste", () => {
    const p = calculerPeriode(
      [
        seance("a", "2026-10-01T17:00:00.000Z"),
        seance("b", "2026-09-01T17:00:00.000Z"),
        seance("c", "2026-08-01T17:00:00.000Z"),
      ],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p.nbSemaines).toBe(4);
    expect(p.premierLundi).toBe("2026-09-07");
    // Séries de travail : 4 + 3, l'échauffement n'y est pas (D186).
    expect(p.totaux).toEqual({ seances: 1, series: 7, dureeMin: 45, volumeKg: 1000 });
    expect(p.precedents).toEqual({ seances: 1, series: 7, dureeMin: 45, volumeKg: 1000 });
  });

  it("compare au même moment : le dimanche d'avant ne compte pas un samedi (D185)", () => {
    const p = calculerPeriode(
      [
        seance("sam", "2026-09-26T08:00:00.000Z"), // samedi 26 : même rang qu'aujourd'hui
        seance("dim", "2026-09-27T08:00:00.000Z"), // dimanche 27 : après ce rang
      ],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.precedents.seances).toBe(1);
  });

  it("découpe dans le fuseau : le dimanche 23 h 30 à Paris reste dans la semaine d'avant", () => {
    const p = calculerPeriode(
      [
        seance("dim", "2026-09-06T21:30:00.000Z"), // dimanche 6, 23 h 30 à Paris
        seance("lun", "2026-09-06T22:30:00.000Z"), // lundi 7, 0 h 30 à Paris
      ],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p.totaux.seances).toBe(1);
    // Dimanche 6 est le dernier jour de la précédente : après le même moment (D185).
    expect(p.precedents.seances).toBe(0);
    expect(p.jours.map((j) => j.jour)).toEqual(["2026-09-07"]);
  });

  it("additionne les séances d'un même jour, et les séries par zone principale", () => {
    const p = calculerPeriode(
      [seance("a", "2026-10-01T08:00:00.000Z", 500), seance("b", "2026-10-01T17:00:00.000Z", 700)],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.jours).toEqual([{ jour: "2026-10-01", volumeKg: 1200, seances: ["a", "b"] }]);
    expect(p.zones).toEqual([
      { zone: "chest", series: 8, reference: 0 },
      { zone: "triceps", series: 6, reference: 0 },
    ]);
  });

  it("rend au moins douze semaines au graphique, la période marquée (D187)", () => {
    const p = calculerPeriode(
      [seance("a", "2026-10-01T08:00:00.000Z", 500), seance("v", "2026-08-12T08:00:00.000Z", 900)],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.volumes).toHaveLength(12);
    expect(p.volumes[0]?.lundi).toBe("2026-07-13");
    expect(p.volumes.at(-1)).toEqual({
      lundi: "2026-09-28",
      volumeKg: 500,
      seances: 1,
      series: 7,
      dansPeriode: true,
    });
    expect(p.volumes.filter((v) => v.dansPeriode)).toHaveLength(1);
    // Mercredi 12 août : la semaine du lundi 10, hors période mais dans le graphique.
    expect(p.volumes.find((v) => v.lundi === "2026-08-10")?.volumeKg).toBe(900);
    expect(calculerPeriode([], maintenant, PARIS, "annee").volumes).toHaveLength(52);
  });

  it("compare chaque zone à la moyenne des huit semaines d'avant (D188)", () => {
    // Deux séances dans les 8 semaines avant le lundi 28 septembre, aucune pendant.
    const p = calculerPeriode(
      [seance("x", "2026-09-15T08:00:00.000Z"), seance("y", "2026-08-20T08:00:00.000Z")],
      maintenant,
      PARIS,
      "semaine",
    );
    // Pectoraux : 2 × 4 = 8 séries sur 8 semaines → 1 par semaine ; triceps : 2 × 3 / 8 → 1.
    expect(p.zones).toEqual([
      { zone: "chest", series: 0, reference: 1 },
      { zone: "triceps", series: 0, reference: 1 },
    ]);
  });

  it("ignore une séance après la fin de la période", () => {
    const p = calculerPeriode(
      [seance("f", "2026-10-06T08:00:00.000Z")],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.totaux.seances).toBe(0);
  });
});

describe("semainesALire (D187, D188)", () => {
  it("couvre la période d'avant, la référence et le graphique, plus une de marge", () => {
    expect(semainesALire("semaine")).toBe(13);
    expect(semainesALire("mois")).toBe(13);
    expect(semainesALire("trimestre")).toBe(27);
    expect(semainesALire("annee")).toBe(105);
  });
});

describe("niveauxCalendrier (D126)", () => {
  const j = (jour: string, volumeKg: number) => ({ jour, volumeKg, seances: [] });

  it("classe les jours par quartile de leur propre volume", () => {
    const n = niveauxCalendrier([j("a", 400), j("b", 100), j("c", 300), j("d", 200)]);
    expect([n.get("b"), n.get("d"), n.get("c"), n.get("a")]).toEqual([1, 2, 3, 4]);
  });

  it("donne le même niveau à volume égal, et le plus haut à un jour seul", () => {
    const n = niveauxCalendrier([j("a", 100), j("b", 100), j("c", 300), j("d", 400)]);
    expect(n.get("a")).toBe(n.get("b"));
    expect(niveauxCalendrier([j("x", 0)]).get("x")).toBe(4);
  });
});

describe("semainesTenues (D126)", () => {
  const v = (...n: number[]) => n.map((seances) => ({ seances }));

  it("compte les semaines où l'objectif est atteint", () => {
    expect(semainesTenues(v(3, 1, 4, 3), 3)).toEqual({ tenues: 3, sur: 4 });
  });

  it("ne juge pas la semaine en cours tant qu'elle n'a pas atteint l'objectif", () => {
    expect(semainesTenues(v(3, 3, 1), 3)).toEqual({ tenues: 2, sur: 2 });
  });
});

describe("joursDeLaSemaine (D166)", () => {
  const jour = (cle: string) => ({ jour: cle, volumeKg: 100, seances: ["x"] });

  it("rend les sept jours du lundi au dimanche, entraînés, aujourd'hui et à venir", () => {
    // Samedi 3 octobre 2026, 18 h à Paris.
    const j = joursDeLaSemaine(
      "2026-09-28",
      [jour("2026-09-28"), jour("2026-10-01")],
      maintenant,
      PARIS,
    );
    expect(j.map((x) => x.jour)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(j.map((x) => x.entraine)).toEqual([true, false, false, true, false, false, false]);
    expect(j.map((x) => x.aujourdhui)).toEqual([false, false, false, false, false, true, false]);
    expect(j.map((x) => x.avenir)).toEqual([false, false, false, false, false, false, true]);
  });

  it("prend aujourd'hui dans le fuseau : samedi 23 h 30 à Paris n'est pas dimanche", () => {
    const samediSoir = new Date("2026-10-03T21:30:00.000Z");
    const j = joursDeLaSemaine("2026-09-28", [], samediSoir, PARIS);
    expect(j.findIndex((x) => x.aujourdhui)).toBe(5);
  });
});
