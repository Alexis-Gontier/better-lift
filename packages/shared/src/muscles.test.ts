import { describe, expect, it } from "vitest";
import { MUSCLES_SANS_ZONE, zoneDuMuscle, zonesTravaillees } from "./muscles.js";

// Les noms de muscles présents dans le catalogue (`target` et `secondary`),
// relevés sur `betterlift` le 25 septembre 2026. Un nom ajouté au catalogue sans
// zone ni exclusion explicite ferait échouer le premier test.
const MUSCLES_CATALOGUE = [
  "Triceps",
  "Épaules",
  "Biceps",
  "Ischio-jambiers",
  "Avant-bras",
  "Fessiers",
  "Pectoraux",
  "Quadriceps",
  "Mollets",
  "Deltoïdes",
  "Abdominaux",
  "Haut du dos",
  "Trapèzes",
  "Gainage",
  "Grand dorsal",
  "Fléchisseurs de hanche",
  "Obliques",
  "Bas du dos",
  "Rhomboïdes",
  "Système cardiovasculaire",
  "Deltoïdes postérieurs",
  "Érecteurs du rachis",
  "Brachial",
  "Chevilles",
  "Dos",
  "Pieds",
  "Adducteurs",
  "Coiffe des rotateurs",
  "Abducteurs",
  "Dentelé antérieur",
  "Stabilisateurs de la cheville",
  "Soléaire",
  "Haut des pectoraux",
  "Poignets",
  "Mains",
  "Sterno-cléido-mastoïdien",
  "Extenseurs du poignet",
  "Élévateur de la scapula",
  "Fléchisseurs du poignet",
  "Tibias",
  "Intérieur des cuisses",
  "Muscles de la prise",
  "Bas des abdominaux",
];

describe("zoneDuMuscle", () => {
  it.each(MUSCLES_CATALOGUE)("« %s » a une zone ou est explicitement ignoré", (nom) => {
    expect(zoneDuMuscle(nom) !== null || MUSCLES_SANS_ZONE.includes(nom)).toBe(true);
  });

  it("rattache les sous-muscles à leur zone", () => {
    expect(zoneDuMuscle("Haut des pectoraux")).toBe("chest");
    expect(zoneDuMuscle("Grand dorsal")).toBe("upper-back");
    expect(zoneDuMuscle("Érecteurs du rachis")).toBe("lower-back");
  });

  it("ignore un nom inconnu ou sans zone", () => {
    expect(zoneDuMuscle("Système cardiovasculaire")).toBeNull();
    expect(zoneDuMuscle("Muscle imaginaire")).toBeNull();
  });
});

describe("zonesTravaillees", () => {
  it("le principal l'emporte sur le secondaire", () => {
    const zones = zonesTravaillees([
      { musclePrincipal: "Pectoraux", musclesSecondaires: ["Triceps", "Épaules"] },
      { musclePrincipal: "Triceps", musclesSecondaires: [] },
    ]);
    expect(zones).toEqual([
      { zone: "chest", niveau: "principal" },
      { zone: "triceps", niveau: "principal" },
      { zone: "deltoids", niveau: "secondaire" },
    ]);
  });

  it("classe les principales d'abord, par fréquence décroissante", () => {
    const zones = zonesTravaillees([
      { musclePrincipal: "Biceps", musclesSecondaires: ["Avant-bras"] },
      { musclePrincipal: "Grand dorsal", musclesSecondaires: ["Biceps", "Trapèzes"] },
      { musclePrincipal: "Rhomboïdes", musclesSecondaires: ["Trapèzes"] },
    ]);
    expect(zones.map((z) => z.zone)).toEqual(["upper-back", "biceps", "trapezius", "forearm"]);
  });

  it("ignore les muscles sans zone et ne répète jamais une zone", () => {
    const zones = zonesTravaillees([
      { musclePrincipal: "Système cardiovasculaire", musclesSecondaires: ["Mollets"] },
      { musclePrincipal: "Soléaire", musclesSecondaires: ["Mollets"] },
    ]);
    expect(zones).toEqual([{ zone: "calves", niveau: "principal" }]);
  });

  it("rend une liste vide pour une routine sans exercice", () => {
    expect(zonesTravaillees([])).toEqual([]);
  });
});
