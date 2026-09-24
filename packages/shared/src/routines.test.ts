import { describe, expect, it } from "vitest";
import { ordreRoutines, routineSaisie } from "./routines.js";

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
