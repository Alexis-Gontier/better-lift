import { describe, expect, it } from "vitest";
import { PREFERENCES_DEFAUT, preferences } from "./preferences.js";

describe("preferences (D129)", () => {
  it("accepte des préférences réglées, et celles d'un compte qui n'a rien réglé", () => {
    const p = { objectifHebdo: 3, reposDefautSec: 90 };
    expect(preferences.parse(p)).toEqual(p);
    expect(preferences.parse(PREFERENCES_DEFAUT)).toEqual(PREFERENCES_DEFAUT);
  });

  it("borne l'objectif de 1 à 7 séances entières par semaine", () => {
    for (const objectifHebdo of [0, 8, 2.5]) {
      expect(() => preferences.parse({ objectifHebdo, reposDefautSec: null })).toThrow();
    }
  });

  it("borne le repos par défaut de 0 à 3600 secondes, comme celui d'une routine", () => {
    for (const reposDefautSec of [-1, 3601, 1.5]) {
      expect(() => preferences.parse({ objectifHebdo: null, reposDefautSec })).toThrow();
    }
  });

  it("exige les deux champs : un PUT remplace tout", () => {
    expect(() => preferences.parse({ objectifHebdo: 3 })).toThrow();
  });
});
