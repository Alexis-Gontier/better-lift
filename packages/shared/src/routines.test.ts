import { describe, expect, it } from "vitest";
import {
  dossierSaisi,
  dureeEstimeeSec,
  etiquettesSeries,
  meilleureSerie,
  ordreRoutines,
  resumeSeries,
  routineSaisie,
  type SerieRoutine,
} from "./routines.js";

const serie = { type: "NORMALE", repsCible: 8, chargeCibleKg: 82.5 };
const exercice = { slug: "barbell-bench-press", reposSec: 120, series: [serie] };
const valide = { nom: "Push", exercices: [exercice] };

describe("routineSaisie", () => {
  it("accepte une routine complète", () => {
    expect(routineSaisie.parse(valide)).toEqual(valide);
  });

  it("détoure le nom et refuse un nom vide ou trop long", () => {
    expect(routineSaisie.parse({ ...valide, nom: "  Push  " }).nom).toBe("Push");
    expect(() => routineSaisie.parse({ ...valide, nom: "   " })).toThrow();
    expect(() => routineSaisie.parse({ ...valide, nom: "x".repeat(121) })).toThrow();
  });

  it("exige au moins un exercice, et au moins une série par exercice", () => {
    expect(() => routineSaisie.parse({ ...valide, exercices: [] })).toThrow();
    expect(() =>
      routineSaisie.parse({ ...valide, exercices: [{ ...exercice, series: [] }] }),
    ).toThrow();
  });

  it("borne le nombre d'exercices et de séries", () => {
    expect(() => routineSaisie.parse({ ...valide, exercices: Array(51).fill(exercice) })).toThrow();
    expect(() =>
      routineSaisie.parse({
        ...valide,
        exercices: [{ ...exercice, series: Array(21).fill(serie) }],
      }),
    ).toThrow();
  });

  it("refuse un type inconnu, des reps ou une charge hors bornes", () => {
    const avec = (s: object) => ({
      ...valide,
      exercices: [{ ...exercice, series: [{ ...serie, ...s }] }],
    });
    expect(() => routineSaisie.parse(avec({ type: "SUPER" }))).toThrow();
    expect(() => routineSaisie.parse(avec({ repsCible: -1 }))).toThrow();
    expect(() => routineSaisie.parse(avec({ repsCible: 2.5 }))).toThrow();
    expect(() => routineSaisie.parse(avec({ chargeCibleKg: -5 }))).toThrow();
    expect(() => routineSaisie.parse(avec({ chargeCibleKg: 1001 }))).toThrow();
  });

  it("accepte des cibles absentes", () => {
    const libre = { type: "ECHEC", repsCible: null, chargeCibleKg: null };
    expect(() =>
      routineSaisie.parse({
        ...valide,
        exercices: [{ ...exercice, reposSec: null, series: [libre] }],
      }),
    ).not.toThrow();
  });

  // L'ordre du tableau EST la position : le client n'envoie aucune position.
  it("conserve l'ordre des exercices, doublons compris", () => {
    const deux = [exercice, { ...exercice, slug: "pull-up" }, exercice];
    expect(
      routineSaisie.parse({ ...valide, exercices: deux }).exercices.map((e) => e.slug),
    ).toEqual(["barbell-bench-press", "pull-up", "barbell-bench-press"]);
  });
});

describe("ordreRoutines", () => {
  it("accepte une liste d'identifiants", () => {
    expect(ordreRoutines.parse({ ids: ["a", "b"] })).toEqual({ ids: ["a", "b"] });
  });

  it("refuse les doublons", () => {
    expect(() => ordreRoutines.parse({ ids: ["a", "a"] })).toThrow();
  });
});

describe("etiquettesSeries", () => {
  it("marque l'échauffement et numérote les autres séries à part", () => {
    expect(etiquettesSeries(["ECHAUFFEMENT", "NORMALE", "NORMALE", "ECHEC", "DEGRESSIVE"])).toEqual(
      ["É", "1", "2", "3", "4"],
    );
  });

  it("numérote depuis 1 même après plusieurs échauffements", () => {
    expect(etiquettesSeries(["ECHAUFFEMENT", "ECHAUFFEMENT", "NORMALE"])).toEqual(["É", "É", "1"]);
  });
});

describe("meilleureSerie", () => {
  it("retient la série faite la plus lourde, puis la plus longue à charge égale", () => {
    expect(
      meilleureSerie([
        { reps: 10, chargeKg: 40, faite: true },
        { reps: 8, chargeKg: 80, faite: true },
        { reps: 9, chargeKg: 80, faite: true },
        { reps: 5, chargeKg: 100, faite: false },
      ]),
    ).toEqual({ reps: 9, chargeKg: 80 });
  });

  it("au poids du corps, retient le plus de répétitions", () => {
    expect(
      meilleureSerie([
        { reps: 8, chargeKg: null, faite: true },
        { reps: 12, chargeKg: null, faite: true },
      ]),
    ).toEqual({ reps: 12, chargeKg: null });
  });

  it("sans série faite, ne rend rien", () => {
    expect(meilleureSerie([{ reps: 8, chargeKg: 60, faite: false }])).toBeNull();
    expect(meilleureSerie([])).toBeNull();
  });
});

describe("résumés d'une routine", () => {
  const S = (type: SerieRoutine["type"], reps: number | null, kg: number | null): SerieRoutine => ({
    type,
    repsCible: reps,
    chargeCibleKg: kg,
  });

  it("résume des séries identiques en « séries × reps · charge »", () => {
    expect(
      resumeSeries([S("NORMALE", 8, 60), S("NORMALE", 8, 60), S("NORMALE", 8, 60)], "metric"),
    ).toBe("3 × 8 · 60 kg");
  });

  it("compte les échauffements à part et garde la charge la plus lourde", () => {
    expect(
      resumeSeries([S("ECHAUFFEMENT", 10, 40), S("NORMALE", 8, 80), S("ECHEC", 6, 82.5)], "metric"),
    ).toBe("2 séries · 82,5 kg · 1 échauffement");
  });

  it("se contente du nombre quand rien n'est fixé", () => {
    expect(resumeSeries([S("NORMALE", null, null), S("NORMALE", null, null)], "metric")).toBe(
      "2 séries",
    );
    expect(resumeSeries([S("ECHAUFFEMENT", 10, null), S("ECHAUFFEMENT", 10, null)], "metric")).toBe(
      "2 échauffements",
    );
  });

  it("estime 40 s par série plus les repos entre les séries", () => {
    const ex = (n: number, reposSec: number | null) => ({
      reposSec,
      series: Array.from({ length: n }, () => S("NORMALE", 8, 60)),
    });
    // 3 séries : 3 × 40 + 2 × 90 = 300 ; 2 séries sans repos : 80.
    expect(dureeEstimeeSec([ex(3, 90), ex(2, null)])).toBe(380);
    expect(dureeEstimeeSec([])).toBe(0);
  });
});

describe("routineSaisie et les supersets (D145)", () => {
  const exo = {
    slug: "a",
    reposSec: null,
    series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: null }],
  };
  const avec = (g?: number | null) => ({
    nom: "Push",
    exercices: [g === undefined ? exo : { ...exo, supersetGroupe: g }],
  });
  it("accepte un exercice sans supersetGroupe", () => {
    expect(routineSaisie.safeParse(avec()).success).toBe(true);
  });
  it("accepte un groupe ou null", () => {
    expect(routineSaisie.safeParse(avec(1)).success).toBe(true);
    expect(routineSaisie.safeParse(avec(null)).success).toBe(true);
  });
  it("refuse un groupe nul ou négatif", () => {
    expect(routineSaisie.safeParse(avec(0)).success).toBe(false);
  });
});

describe("routineSaisie : note et dossier (D298)", () => {
  const base = {
    nom: "Push",
    exercices: [{ slug: "a", reposSec: null, series: [serie] }],
  };

  it("laisse note et dossier absents : l'écriture les garde", () => {
    const s = routineSaisie.parse(base);
    expect(s.note).toBeUndefined();
    expect(s.dossierId).toBeUndefined();
  });

  it("rogne la note, et ramène une note blanche à null", () => {
    expect(routineSaisie.parse({ ...base, note: "  Lent  " }).note).toBe("Lent");
    expect(routineSaisie.parse({ ...base, note: "   " }).note).toBeNull();
    expect(routineSaisie.parse({ ...base, note: null }).note).toBeNull();
  });

  it("refuse une note de plus de 1000 caractères", () => {
    expect(routineSaisie.safeParse({ ...base, note: "x".repeat(1001) }).success).toBe(false);
  });

  it("accepte un dossier, ou null pour « Sans dossier »", () => {
    expect(routineSaisie.parse({ ...base, dossierId: "d1" }).dossierId).toBe("d1");
    expect(routineSaisie.parse({ ...base, dossierId: null }).dossierId).toBeNull();
  });
});

describe("dossierSaisi (D297)", () => {
  it("rogne le nom, et refuse le vide ou plus de 60 caractères", () => {
    expect(dossierSaisi.parse({ nom: "  PPL " }).nom).toBe("PPL");
    expect(dossierSaisi.safeParse({ nom: " " }).success).toBe(false);
    expect(dossierSaisi.safeParse({ nom: "x".repeat(61) }).success).toBe(false);
  });
});
