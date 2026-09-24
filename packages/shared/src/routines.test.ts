import { describe, expect, it } from "vitest";
import { etiquettesSeries, meilleureSerie, ordreRoutines, routineSaisie } from "./routines.js";

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
