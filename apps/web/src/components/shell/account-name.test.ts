import { describe, expect, it } from "vitest";
import { displayName, initials } from "./account-name";

describe("initiales", () => {
  it("prend une lettre de chaque partie de l'adresse", () => {
    expect(initials("alexis.gontier@gmail.com")).toBe("AG");
  });
  it("prend les deux premières lettres d'une partie unique", () => {
    expect(initials("controle@better-lift.local")).toBe("CO");
  });
  it("rend « ? » pour une adresse vide", () => {
    expect(initials("")).toBe("?");
  });
});

describe("nomAffiche", () => {
  it("capitalise chaque partie", () => {
    expect(displayName("alexis.gontier03@gmail.com")).toBe("Alexis Gontier03");
  });
  it("garde une partie unique", () => {
    expect(displayName("controle@better-lift.local")).toBe("Controle");
  });
  it("rend « Compte » pour une adresse vide", () => {
    expect(displayName("")).toBe("Compte");
  });
});
