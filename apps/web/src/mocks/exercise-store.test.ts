import { describe, expect, it } from "vitest";
import { customSlug, deleteExercise, saveExercise } from "./exercise-store";
import { mockExercises } from "./exercises";

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

describe("suppression d'un exercice", () => {
  it("retire un exercice personnel et le remet à sa place à l'annulation", () => {
    saveExercise({ slug: "perso-test", name: "Test", muscle: "", equipment: "", custom: true });
    const at = mockExercises.findIndex((e) => e.slug === "perso-test");
    const undo = deleteExercise("perso-test");
    expect(mockExercises.some((e) => e.slug === "perso-test")).toBe(false);
    undo();
    expect(mockExercises.findIndex((e) => e.slug === "perso-test")).toBe(at);
  });

  it("ne touche jamais au catalogue", () => {
    const catalogue = mockExercises.find((e) => !e.custom);
    if (!catalogue) throw new Error("catalogue vide");
    deleteExercise(catalogue.slug);
    expect(mockExercises).toContain(catalogue);
  });
});
