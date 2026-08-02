import { describe, expect, it } from "vitest";

import { EQUIPMENT_FILTERS, equipmentLabel } from "./labels";

describe("EQUIPMENT_FILTERS", () => {
  it("n'emploie que des valeurs normalisées comme au seed", () => {
    /**
     * Le seed applique `normalizeEquipment` : minuscules, espaces remplacés par
     * des tirets bas. L'API compare la chaîne telle quelle — une valeur écrite
     * « body weight » ici ne ramènerait donc **rien**, sans la moindre erreur
     * pour le signaler. C'est arrivé, d'où ce test.
     */
    for (const equipment of EQUIPMENT_FILTERS) {
      expect(equipment.value).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});

describe("equipmentLabel", () => {
  it("traduit les valeurs courantes", () => {
    expect(equipmentLabel("body_weight")).toBe("Poids du corps");
  });

  it("rend lisible la longue traîne non traduite", () => {
    expect(equipmentLabel("stability_ball")).toBe("stability ball");
  });
});
