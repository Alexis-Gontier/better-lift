import { describe, expect, it } from "vitest";

import { roundKg, roundTo, toNumber, toNumberOrZero } from "./decimal.js";
import {
  fromDisplayWeight,
  kgToLb,
  lbToKg,
  metersToMiles,
  milesToMeters,
  toDisplayWeight,
  weightUnitLabel,
} from "./units.js";

describe("toNumber", () => {
  it("accepte un Decimal sérialisé en chaîne", () => {
    expect(toNumber("82.50")).toBe(82.5);
    expect(toNumber(" 82.50 ")).toBe(82.5);
  });

  it("échoue bruyamment sur une entrée invalide plutôt que de propager NaN", () => {
    expect(() => toNumber("abc")).toThrow(TypeError);
    expect(() => toNumber("")).toThrow(TypeError);
    expect(() => toNumber(Number.NaN)).toThrow(TypeError);
    expect(() => toNumber(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it("traite null et undefined comme 0 dans la variante tolérante", () => {
    expect(toNumberOrZero(null)).toBe(0);
    expect(toNumberOrZero(undefined)).toBe(0);
    expect(toNumberOrZero("12.34")).toBe(12.34);
  });
});

describe("roundTo", () => {
  it("neutralise la dérive de virgule flottante", () => {
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
    expect(roundKg(1.005)).toBe(1.01);
  });
});

describe("conversions de charge", () => {
  it("convertit dans les deux sens sans dérive perceptible", () => {
    expect(kgToLb("100.00")).toBe(220.46);
    expect(lbToKg("220.46")).toBe(100);
  });

  it("gère les micro-charges de 1,25 kg", () => {
    expect(kgToLb("1.25")).toBe(2.76);
  });

  it("laisse les kg intacts en système métrique", () => {
    expect(toDisplayWeight("82.50", "METRIC")).toBe(82.5);
    expect(fromDisplayWeight("82.50", "METRIC")).toBe(82.5);
  });

  it("fait l'aller-retour d'affichage en impérial", () => {
    const displayed = toDisplayWeight("100.00", "IMPERIAL");
    expect(displayed).toBe(220.46);
    expect(fromDisplayWeight(displayed, "IMPERIAL")).toBe(100);
  });

  it("nomme l'unité affichée", () => {
    expect(weightUnitLabel("METRIC")).toBe("kg");
    expect(weightUnitLabel("IMPERIAL")).toBe("lb");
  });
});

describe("conversions de distance", () => {
  it("convertit mètres et miles", () => {
    expect(metersToMiles("1609.344")).toBe(1);
    expect(milesToMeters("1")).toBe(1609.34);
  });
});
