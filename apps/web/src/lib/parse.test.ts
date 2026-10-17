import { describe, expect, it } from "vitest";
import { parseCount, parseKg } from "./parse";

describe("parseKg", () => {
  it("lit la virgule comme le point", () => {
    expect(parseKg("82,5")).toBe(82.5);
    expect(parseKg("82.5")).toBe(82.5);
  });

  it("rend null pour un champ vide ou illisible", () => {
    expect(parseKg("")).toBeNull();
    expect(parseKg("  ")).toBeNull();
    expect(parseKg("lourd")).toBeNull();
  });

  it("ne descend pas sous zéro", () => {
    expect(parseKg("-5")).toBe(0);
  });
});

describe("parseCount", () => {
  it("lit un entier", () => {
    expect(parseCount("12", 10)).toBe(12);
  });

  it("garde la valeur d'avant si la saisie n'est pas un entier positif", () => {
    expect(parseCount("", 10)).toBe(10);
    expect(parseCount("abc", 10)).toBe(10);
    expect(parseCount("-3", 10)).toBe(10);
  });
});
