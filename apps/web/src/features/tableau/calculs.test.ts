import { describe, expect, it } from "vitest";
import { barresGraphique, dureeTexte, ecart, grilleAnnee, intervallePeriode } from "./calculs";

describe("ecart", () => {
  it("dit l'égalité, l'absence de référence, la hausse et la baisse", () => {
    expect(ecart(4, 4, false)).toBe("= avant");
    expect(ecart(4, 0, false)).toBe("rien avant");
    expect(ecart(7, 4, false)).toBe("+3");
    expect(ecart(88, 100, true)).toBe("−12 %");
  });
});

describe("dureeTexte", () => {
  it("passe aux heures au-delà de 59 minutes", () => {
    expect(dureeTexte(45)).toBe("45 min");
    expect(dureeTexte(125)).toBe("2 h 05");
  });
});

describe("grilleAnnee (D138)", () => {
  // 52 semaines depuis le lundi 6 octobre 2025 ; aujourd'hui, mardi 30 septembre 2026.
  const premierLundi = "2025-10-06";
  const aujourdhui = "2026-09-29";
  const jours = [
    { jour: "2025-10-07", volumeKg: 1000, seances: ["a"] },
    { jour: "2026-09-28", volumeKg: 4000, seances: ["b", "c"] },
  ];

  it("pose 52 colonnes de 7 jours, du lundi au dimanche", () => {
    const { colonnes } = grilleAnnee(jours, premierLundi, "2026-09-07", aujourdhui);
    expect(colonnes).toHaveLength(52);
    expect(colonnes.every((c) => c.length === 7)).toBe(true);
    expect(colonnes[0]?.[0]?.jour).toBe("2025-10-06");
    expect(colonnes[0]?.[6]?.jour).toBe("2025-10-12");
    expect(colonnes[51]?.[0]?.jour).toBe("2026-09-28");
  });

  it("porte le niveau et les séances des jours entraînés, 0 ailleurs", () => {
    const { colonnes } = grilleAnnee(jours, premierLundi, "2026-09-07", aujourdhui);
    expect(colonnes[0]?.[1]).toMatchObject({ niveau: 2, seances: ["a"] });
    expect(colonnes[51]?.[0]).toMatchObject({ niveau: 4, seances: ["b", "c"] });
    expect(colonnes[0]?.[2]).toMatchObject({ niveau: 0, seances: [] });
  });

  it("marque la période, aujourd'hui et les jours à venir", () => {
    const { colonnes } = grilleAnnee(jours, premierLundi, "2026-09-07", aujourdhui);
    expect(colonnes[47]?.[6]?.dansPeriode).toBe(false); // dimanche 6 septembre
    expect(colonnes[48]?.[0]?.dansPeriode).toBe(true); // lundi 7 septembre
    expect(colonnes[51]?.[1]).toMatchObject({ aujourdhui: true, futur: false });
    expect(colonnes[51]?.[2]).toMatchObject({ futur: true, dansPeriode: false });
  });

  it("libelle chaque mois à la colonne où il commence", () => {
    const { mois } = grilleAnnee(jours, premierLundi, "2026-09-07", aujourdhui);
    expect(mois[0]).toEqual({ colonne: 0, libelle: "oct." });
    expect(mois[1]).toEqual({ colonne: 4, libelle: "nov." }); // lundi 3 novembre
    expect(mois).toHaveLength(12);
  });
});

describe("barresGraphique (D187)", () => {
  const s = (lundi: string, volumeKg: number, series: number, dansPeriode: boolean) => ({
    lundi,
    volumeKg,
    seances: 1,
    series,
    dansPeriode,
  });
  const volumes = [
    s("2026-08-24", 1000, 10, false),
    s("2026-08-31", 2000, 12, false),
    s("2026-09-07", 3000, 15, true),
  ];

  it("garde une barre par semaine et marque celles de la période", () => {
    const b = barresGraphique(volumes, "mois", "volume");
    expect(b.map((x) => x.libelle)).toEqual(["24 août", "31 août", "7 sept."]);
    expect(b.map((x) => x.dansPeriode)).toEqual([false, false, true]);
    expect(b.map((x) => x.valeur)).toEqual([1000, 2000, 3000]);
  });

  it("compte les séries de travail quand on bascule la mesure", () => {
    expect(barresGraphique(volumes, "semaine", "series").map((x) => x.valeur)).toEqual([
      10, 12, 15,
    ]);
  });

  it("regroupe par mois en Année, d'après le mois du lundi", () => {
    const b = barresGraphique(volumes, "annee", "volume");
    expect(b.map((x) => [x.libelle, x.valeur])).toEqual([
      ["août", 3000],
      ["sept.", 3000],
    ]);
  });
});

describe("intervallePeriode (D190)", () => {
  it("dit une semaine, un mois, une année à cheval", () => {
    expect(intervallePeriode("2026-10-12", 1)).toBe("12 – 18 oct. 2026");
    expect(intervallePeriode("2026-09-07", 4)).toBe("7 sept. – 4 oct. 2026");
    expect(intervallePeriode("2025-10-06", 52)).toBe("6 oct. 2025 – 4 oct. 2026");
  });
});

describe("grilleAnnee, période passée (D190)", () => {
  it("ne met en clair que les jours de la période", () => {
    const { colonnes } = grilleAnnee([], "2025-10-13", "2026-09-21", "2026-10-03", "2026-09-27");
    const clairs = colonnes
      .flat()
      .filter((c) => c.dansPeriode)
      .map((c) => c.jour);
    expect(clairs).toEqual([
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
    ]);
  });
});
