import { describe, expect, it } from "vitest";
import { customSlug } from "./exercise-store";

describe("slug d'un exercice personnalisé", () => {
  it("se tire du nom, sans accents ni ponctuation", () => {
    expect(customSlug("Presse à cuisses (salle B)", [])).toBe("perso-presse-a-cuisses-salle-b");
  });

  it("ne heurte pas un exercice existant", () => {
    const taken = ["perso-hack-squat", "perso-hack-squat-2"];
    expect(customSlug("Hack squat", taken)).toBe("perso-hack-squat-3");
  });

  it("a un nom de repli quand le nom ne garde aucun caractère", () => {
    expect(customSlug("—", [])).toBe("perso-exercice");
  });
});
