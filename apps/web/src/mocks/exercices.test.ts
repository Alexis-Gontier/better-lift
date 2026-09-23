import { describe, expect, it } from "vitest";
import { EXERCICES } from "./exercices";

// Ce test garde l'angle mort de la méthode : dessiner sur données factices fait
// manquer ce que seules les vraies données révèlent. Il impose donc les cas
// pénibles — nom trop long, record absent — plutôt que d'attendre le branchement
// pour les découvrir.
describe("données factices du catalogue", () => {
  it("fournit de quoi remplir une liste", () => {
    expect(EXERCICES.length).toBeGreaterThanOrEqual(20);
  });

  it("contient au moins un nom très long, pour éprouver la troncature", () => {
    expect(EXERCICES.some((e) => e.nom.length > 45)).toBe(true);
  });

  it("contient des exercices sans record, pour éprouver l'absence", () => {
    expect(EXERCICES.some((e) => e.record === undefined)).toBe(true);
  });
});
