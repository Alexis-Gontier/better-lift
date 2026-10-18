import { describe, expect, it } from "vitest";
import { stepValue } from "./routine-editor";

describe("pas des boutons − / +", () => {
  it("ajoute et retire le pas", () => {
    expect(stepValue("80", 2.5, 0)).toBe("82.5");
    expect(stepValue("10", -1, 1)).toBe("9");
  });

  it("ne dérive pas sur les décimales", () => {
    expect(stepValue("0.1", 0.2, 0)).toBe("0.3");
  });

  it("ne descend pas sous le minimum", () => {
    expect(stepValue("1", -2.5, 0)).toBe("0");
    expect(stepValue("1", -1, 1)).toBe("1");
  });

  it("part de zéro pour un champ vide qu'on augmente", () => {
    expect(stepValue("", 2.5, 0)).toBe("2.5");
  });
});
