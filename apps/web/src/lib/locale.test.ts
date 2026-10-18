import { describe, expect, it } from "vitest";
import { joursDepuis } from "./locale";

describe("joursDepuis (D313)", () => {
  it("compte en jours civils, pas en tranches de 24 h", () => {
    const maintenant = new Date(2026, 9, 18, 8, 0); // le 18 à 8 h, heure locale
    expect(joursDepuis(new Date(2026, 9, 18, 0, 5), maintenant)).toBe(0);
    // La veille à 23 h 30 : moins de 24 h, mais hier.
    expect(joursDepuis(new Date(2026, 9, 17, 23, 30), maintenant)).toBe(1);
    expect(joursDepuis(new Date(2026, 9, 11, 12, 0), maintenant)).toBe(7);
  });
});
