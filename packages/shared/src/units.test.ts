import { describe, expect, it } from "vitest";
import { kgToLb, lbToKg } from "./units.js";

describe("conversions", () => {
  it("convertit les kilogrammes en livres", () => {
    expect(kgToLb(100)).toBe(220.46);
  });

  it("convertit les livres en kilogrammes", () => {
    expect(lbToKg(220.46)).toBe(100);
  });

  it("fait l'aller-retour sans dériver", () => {
    expect(lbToKg(kgToLb(60))).toBe(60);
  });
});
