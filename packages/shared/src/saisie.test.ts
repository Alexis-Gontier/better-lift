import { describe, expect, it } from "vitest";
import { lireReps } from "./saisie.js";

describe("lireReps", () => {
  it("lit un entier de 0 à 999, vide comme absent, le reste comme invalide", () => {
    expect(lireReps("8")).toBe(8);
    expect(lireReps(" ")).toBeNull();
    expect(lireReps("1000")).toBeNaN();
    expect(lireReps("8,5")).toBeNaN();
  });
});
