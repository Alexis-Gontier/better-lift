import { describe, expect, it } from "vitest";
import { requeteCatalogue } from "./exercices.js";

describe("requeteCatalogue", () => {
  it("accepte une requête vide et pose ses valeurs par défaut", () => {
    expect(requeteCatalogue.parse({})).toEqual({ page: 1, taille: 50 });
  });

  // Les paramètres d'URL arrivent en chaînes : sans coercition, `page=2`
  // échouerait au parse et l'API répondrait 400 sur une requête valide.
  it("convertit les nombres reçus en chaînes", () => {
    expect(requeteCatalogue.parse({ page: "3", taille: "20" })).toMatchObject({
      page: 3,
      taille: 20,
    });
  });

  it("refuse un groupe qui n'est pas dans l'enum", () => {
    expect(() => requeteCatalogue.parse({ groupe: "PECTORAUX" })).toThrow();
    expect(requeteCatalogue.parse({ groupe: "CHEST" })).toMatchObject({ groupe: "CHEST" });
  });

  // La borne qui protège l'API : sans plafond, `taille=100000` fait remonter
  // tout le catalogue à chaque appel.
  it("borne la pagination", () => {
    expect(() => requeteCatalogue.parse({ taille: "0" })).toThrow();
    expect(() => requeteCatalogue.parse({ taille: "1000" })).toThrow();
    expect(() => requeteCatalogue.parse({ page: "0" })).toThrow();
  });

  it("détoure la recherche", () => {
    expect(requeteCatalogue.parse({ q: "  squat " })).toMatchObject({ q: "squat" });
  });
});
