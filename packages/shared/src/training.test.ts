import { describe, expect, it } from "vitest";
import { estimate1RM, setVolume } from "./training.js";

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

describe("setVolume", () => {
  it("multiplie la charge par les répétitions", () => {
    expect(setVolume({ weightKg: 80, reps: 8, type: "normal" })).toBe(640);
  });

  it("ignore les séries d'échauffement", () => {
    expect(setVolume({ weightKg: 40, reps: 10, type: "warmup" })).toBe(0);
  });

  it("compte les séries dégressives et à l'échec", () => {
    expect(setVolume({ weightKg: 50, reps: 6, type: "dropset" })).toBe(300);
    expect(setVolume({ weightKg: 50, reps: 4, type: "failure" })).toBe(200);
  });
});
