import { describe, expect, it } from "vitest";
import { GROUPES, LIBELLE_GROUPE } from "./vocabulaire.js";

describe("vocabulaire des groupes musculaires", () => {
  it("porte les dix valeurs de l'enum, sans doublon", () => {
    expect(GROUPES).toHaveLength(10);
    expect(new Set(GROUPES).size).toBe(10);
  });

  it("donne un libellé non vide à chaque groupe", () => {
    for (const groupe of GROUPES) {
      expect(LIBELLE_GROUPE[groupe]).toBeTruthy();
    }
  });

  // Deux groupes qui porteraient le même libellé seraient indistinguables dans
  // un filtre — le typage ne l'interdit pas, ce test si.
  it("ne donne jamais deux fois le même libellé", () => {
    const libelles = GROUPES.map((g) => LIBELLE_GROUPE[g]);
    expect(new Set(libelles).size).toBe(libelles.length);
  });
});
