import { describe, expect, it } from "vitest";
import { initiales, nomAffiche } from "./nom-compte";

describe("initiales", () => {
  it("prend une lettre de chaque partie de l'adresse", () => {
    expect(initiales("alexis.gontier@gmail.com")).toBe("AG");
  });
  it("prend les deux premières lettres d'une partie unique", () => {
    expect(initiales("controle@better-lift.local")).toBe("CO");
  });
  it("rend « ? » pour une adresse vide", () => {
    expect(initiales("")).toBe("?");
  });
});

describe("nomAffiche", () => {
  it("capitalise chaque partie", () => {
    expect(nomAffiche("alexis.gontier03@gmail.com")).toBe("Alexis Gontier03");
  });
  it("garde une partie unique", () => {
    expect(nomAffiche("controle@better-lift.local")).toBe("Controle");
  });
  it("rend « Compte » pour une adresse vide", () => {
    expect(nomAffiche("")).toBe("Compte");
  });
});
