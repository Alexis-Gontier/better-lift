import { describe, expect, it } from "vitest";
import { cibleApresConnexion } from "./auth";

describe("cibleApresConnexion (D301)", () => {
  it("garde un chemin interne", () => {
    expect(cibleApresConnexion("/routines?x=1")).toBe("/routines?x=1");
  });

  it("refuse une adresse externe ou absente : retour à l'accueil", () => {
    for (const r of ["//evil.com", "https://evil.com", undefined, 3, "routines"]) {
      expect(cibleApresConnexion(r)).toBe("/");
    }
  });
});
