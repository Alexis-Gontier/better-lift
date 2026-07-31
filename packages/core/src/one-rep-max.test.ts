import { describe, expect, it } from "vitest";

import { estimate1RM, MAX_1RM_REPS } from "./one-rep-max.js";

describe("estimate1RM", () => {
  it("applique Epley par défaut (D11)", () => {
    // 100 × (1 + 5/30) = 116.67
    expect(estimate1RM("100.00", 5)).toBe(116.67);
  });

  it("renvoie la charge telle quelle sur une répétition", () => {
    expect(estimate1RM("140.00", 1)).toBe(140);
  });

  it("applique Brzycki sur demande", () => {
    // 100 × 36 / (37 - 5) = 112.5
    expect(estimate1RM("100.00", 5, "BRZYCKI")).toBe(112.5);
  });

  it("croît avec les répétitions à charge égale", () => {
    const values = [1, 3, 5, 8, 12].map((reps) => estimate1RM("100.00", reps));

    expect(values).toEqual([...values].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it("refuse au-delà de 12 répétitions, où l'estimation ne veut plus rien dire", () => {
    expect(estimate1RM("100.00", MAX_1RM_REPS)).not.toBeNull();
    expect(estimate1RM("100.00", MAX_1RM_REPS + 1)).toBeNull();
  });

  it("refuse les répétitions nulles, négatives ou non entières", () => {
    expect(estimate1RM("100.00", 0)).toBeNull();
    expect(estimate1RM("100.00", -3)).toBeNull();
    expect(estimate1RM("100.00", 2.5)).toBeNull();
  });

  it("refuse une charge nulle : poids de corps et durée n'ont pas de 1RM", () => {
    expect(estimate1RM("0.00", 10)).toBeNull();
    expect(estimate1RM(0, 10)).toBeNull();
  });
});
