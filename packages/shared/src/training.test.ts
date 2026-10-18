import { describe, expect, it } from "vitest";
import { estimate1RM } from "./training.js";

describe("estimate1RM", () => {
  it("rend la charge elle-même à une seule répétition", () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it("applique la formule d'Epley au-delà d'une répétition", () => {
    // Epley : poids × (1 + reps / 30) → 100 × (1 + 5/30) = 116,666…
    expect(estimate1RM(100, 5)).toBe(116.7);
  });

  it("rend 0 pour zéro répétition", () => {
    expect(estimate1RM(100, 0)).toBe(0);
  });
});
