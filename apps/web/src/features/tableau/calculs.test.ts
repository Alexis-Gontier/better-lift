import { describe, expect, it } from "vitest";
import { dureeTexte, ecart, grilleAnnee, volumesAffiches } from "./calculs";

describe("ecart", () => {
  it("dit l'égalité, l'absence de référence, la hausse et la baisse", () => {
    expect(ecart(4, 4, false)).toBe("= avant");
    expect(ecart(4, 0, false)).toBe("rien avant");
    expect(ecart(7, 4, false)).toBe("↗ +3");
    expect(ecart(88, 100, true)).toBe("↘ −12 %");
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

describe("volumesAffiches", () => {
  const volumes = [
    { lundi: "2026-08-24", volumeKg: 1000, seances: 1 },
    { lundi: "2026-08-31", volumeKg: 2000, seances: 2 },
    { lundi: "2026-09-07", volumeKg: 3000, seances: 2 },
  ];

  it("garde une barre par semaine, la dernière est la courante", () => {
    const v = volumesAffiches(volumes, "mois");
    expect(v.map((x) => x.libelle)).toEqual(["24 août", "31 août", "7 sept."]);
    expect(v.map((x) => x.courante)).toEqual([false, false, true]);
  });

  it("regroupe par mois en Année, d'après le mois du lundi", () => {
    const v = volumesAffiches(volumes, "annee");
    expect(v.map((x) => [x.libelle, x.volumeKg])).toEqual([
      ["août", 3000],
      ["sept.", 3000],
    ]);
    expect(v.at(-1)?.courante).toBe(true);
  });
});
