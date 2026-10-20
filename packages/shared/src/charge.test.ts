import { describe, expect, it } from "vitest";
import { chargeEnTexte, formaterCharge, lireCharge, lireReps } from "./charge.js";

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

describe("chargeEnTexte", () => {
  // Ce qu'on met DANS un champ : l'unité est à côté, et « 1 000 » ne se
  // relirait pas — pas de séparateur de milliers.
  it("rend le nombre seul, sans unité ni séparateur de milliers", () => {
    expect(chargeEnTexte(82.5, "metric")).toBe("82,5");
    expect(chargeEnTexte(1000, "metric")).toBe("1000");
    expect(chargeEnTexte(100, "imperial")).toBe("220,46");
  });

  it("se relit par lireCharge", () => {
    expect(lireCharge(chargeEnTexte(1000, "metric"), "metric")).toBe(1000);
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
