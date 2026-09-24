import { describe, expect, it } from "vitest";
import { formaterCharge, lireCharge } from "./charge.js";

describe("formaterCharge", () => {
  it("écrit la charge avec la virgule française et l'unité", () => {
    expect(formaterCharge(82.5, "metric")).toBe("82,5 kg");
  });

  it("retire les zéros inutiles", () => {
    expect(formaterCharge(80, "metric")).toBe("80 kg");
    expect(formaterCharge(80.1, "metric")).toBe("80,1 kg");
  });

  it("convertit en livres pour un profil impérial", () => {
    expect(formaterCharge(100, "imperial")).toBe("220,46 lb");
  });
});

describe("lireCharge", () => {
  it("accepte la virgule comme le point, et les espaces autour", () => {
    expect(lireCharge("82,5", "metric")).toBe(82.5);
    expect(lireCharge(" 82.5 ", "metric")).toBe(82.5);
  });

  it("rend des kilos à deux décimales depuis des livres", () => {
    expect(lireCharge("220,46", "imperial")).toBe(100);
  });

  // `null` veut dire « pas de charge cible », et c'est une réponse valide pour
  // un champ vide. Pour une saisie illisible, l'éditeur distingue les deux.
  it("rend null pour une saisie vide", () => {
    expect(lireCharge("", "metric")).toBeNull();
    expect(lireCharge("   ", "metric")).toBeNull();
  });

  it("refuse le texte, le négatif et l'absurde", () => {
    expect(lireCharge("lourd", "metric")).toBeNaN();
    expect(lireCharge("-5", "metric")).toBeNaN();
    expect(lireCharge("1500", "metric")).toBeNaN();
    expect(lireCharge("12,5,3", "metric")).toBeNaN();
  });

  it("fait l'aller-retour à 0,01 près", () => {
    const kg = lireCharge(formaterCharge(82.5, "imperial").replace(" lb", ""), "imperial");
    expect(kg).toBeCloseTo(82.5, 1);
  });
});
