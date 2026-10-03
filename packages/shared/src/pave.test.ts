import { describe, expect, it } from "vitest";
import { ajusterSurPave, effacerSurPave, lireReps, toucherPave } from "./pave.js";

describe("toucherPave (D109)", () => {
  it("ajoute le chiffre à la fin", () => {
    expect(toucherPave("8", "2", { champ: "charge", neuf: false })).toBe("82");
  });

  // La case affichée porte la cible : la première touche la remplace, comme un
  // champ dont le texte serait sélectionné.
  it("remplace la valeur à la première touche", () => {
    expect(toucherPave("80", "7", { champ: "charge", neuf: true })).toBe("7");
    expect(toucherPave("80", ",", { champ: "charge", neuf: true })).toBe("0,");
  });

  it("n'accepte qu'une virgule, et seulement pour la charge", () => {
    expect(toucherPave("82,5", ",", { champ: "charge", neuf: false })).toBe("82,5");
    expect(toucherPave("8", ",", { champ: "reps", neuf: false })).toBe("8");
    expect(toucherPave("", ",", { champ: "charge", neuf: false })).toBe("0,");
  });

  it("ne garde pas de zéro en tête", () => {
    expect(toucherPave("0", "5", { champ: "reps", neuf: false })).toBe("5");
    expect(toucherPave("0", "0", { champ: "charge", neuf: false })).toBe("0");
  });

  it("borne la longueur : 3 chiffres de reps, 2 décimales de charge", () => {
    expect(toucherPave("120", "5", { champ: "reps", neuf: false })).toBe("120");
    expect(toucherPave("82,25", "5", { champ: "charge", neuf: false })).toBe("82,25");
    expect(toucherPave("1000", "0", { champ: "charge", neuf: false })).toBe("1000");
  });
});

describe("effacerSurPave", () => {
  it("retire le dernier caractère", () => {
    expect(effacerSurPave("82,5")).toBe("82,");
    expect(effacerSurPave("")).toBe("");
  });
});

describe("ajusterSurPave", () => {
  it("ajoute ou retire un pas, virgule française, sans zéros inutiles", () => {
    expect(ajusterSurPave("80", 2.5)).toBe("82,5");
    expect(ajusterSurPave("82,5", 2.5)).toBe("85");
    expect(ajusterSurPave("82,5", -2.5)).toBe("80");
  });

  it("part de zéro sur une case vide, et ne descend pas sous zéro", () => {
    expect(ajusterSurPave("", 2.5)).toBe("2,5");
    expect(ajusterSurPave("1", -2.5)).toBe("0");
  });
});

describe("lireReps", () => {
  it("lit un entier de 0 à 999, vide comme absent, le reste comme invalide", () => {
    expect(lireReps("8")).toBe(8);
    expect(lireReps(" ")).toBeNull();
    expect(lireReps("1000")).toBeNaN();
    expect(lireReps("8,5")).toBeNaN();
  });
});
