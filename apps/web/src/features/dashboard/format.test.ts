import { describe, expect, it } from "vitest";

import {
  formatPercent,
  formatTotalDuration,
  formatVolume,
  heatLevel,
  relativeChange,
  toWeekColumns,
  trendOf,
} from "./format";

describe("relativeChange", () => {
  it("should compute the relative change between two periods", () => {
    expect(relativeChange(12, 10)).toBeCloseTo(0.2);
    expect(relativeChange(8, 10)).toBeCloseTo(-0.2);
    expect(relativeChange(10, 10)).toBe(0);
  });

  /**
   * Passer de 0 à 12 séances n'est ni « +∞ % » ni « +1200 % » : c'est un début.
   * L'appelant affiche un tiret plutôt qu'un nombre qui ne veut rien dire.
   */
  it("should return null when the previous period is empty", () => {
    expect(relativeChange(12, 0)).toBeNull();
    expect(relativeChange(0, 0)).toBeNull();
  });
});

describe("trendOf", () => {
  it("should treat a change under one percent as flat", () => {
    // Sans ce seuil, 0,3 % afficherait une flèche montante — du bruit de mesure.
    expect(trendOf(0.003)).toBe("flat");
    expect(trendOf(-0.009)).toBe("flat");
    expect(trendOf(0)).toBe("flat");
  });

  it("should report a direction beyond the threshold", () => {
    expect(trendOf(0.08)).toBe("up");
    expect(trendOf(-0.08)).toBe("down");
  });

  it("should stay flat when there is nothing to compare", () => {
    expect(trendOf(null)).toBe("flat");
  });
});

describe("formatVolume", () => {
  it("should use kilograms below a tonne", () => {
    expect(formatVolume("840.00", "fr-FR", "METRIC")).toBe("840 kg");
    expect(formatVolume("0.00", "fr-FR", "METRIC")).toBe("0 kg");
  });

  it("should switch to tonnes above a tonne", () => {
    // 84 250 kg en kilogrammes est un nombre à six chiffres que personne ne lit.
    expect(formatVolume("84250.00", "fr-FR", "METRIC")).toBe("84,3 t");
    expect(formatVolume("1000.00", "fr-FR", "METRIC")).toBe("1 t");
  });

  /**
   * Le défaut que la page de préférences a révélé : le volume restait en
   * kilogrammes quel que soit le profil, alors que les charges d'à côté
   * passaient bien en livres. Deux unités sur le même écran pour la même
   * grandeur, c'est la confusion qu'un tracker de charges ne peut pas se
   * permettre.
   */
  it("should convert to pounds for an imperial profile", () => {
    expect(formatVolume("840.00", "en-GB", "IMPERIAL")).toBe("1,852 lb");
  });

  it("should switch to short tons above two thousand pounds", () => {
    // La tonne courte vaut 2 000 lb, d'où un seuil différent du métrique.
    expect(formatVolume("84250.00", "en-GB", "IMPERIAL")).toBe("92.9 t (US)");
  });

  it("should never label a short ton like a metric one", () => {
    // Écrire « t » des deux côtés ferait passer 1 000 kg pour 907 kg.
    expect(formatVolume("50000.00", "fr-FR", "METRIC")).toContain(" t");
    expect(formatVolume("50000.00", "fr-FR", "IMPERIAL")).toContain("t (US)");
  });

  it("should degrade gracefully on a value it cannot read", () => {
    expect(formatVolume("indisponible", "fr-FR", "METRIC")).toBe("—");
    expect(formatVolume("indisponible", "fr-FR", "IMPERIAL")).toBe("—");
  });
});

describe("formatTotalDuration", () => {
  it("should render hours and two-digit minutes", () => {
    expect(formatTotalDuration(15_120)).toBe("4 h 12");
    // « 4 h 05 » et non « 4 h 5 ».
    expect(formatTotalDuration(14_700)).toBe("4 h 05");
  });

  it("should render minutes alone under an hour", () => {
    expect(formatTotalDuration(2880)).toBe("48 min");
  });

  it("should render a dash for an empty duration", () => {
    expect(formatTotalDuration(0)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("should always carry a sign except on zero", () => {
    expect(formatPercent(0.08, "fr-FR")).toContain("+");
    expect(formatPercent(-0.08, "fr-FR")).toContain("-");
    expect(formatPercent(0, "fr-FR")).not.toContain("+");
  });
});

describe("heatLevel", () => {
  it("should return zero for a day without workout", () => {
    expect(heatLevel(0)).toBe(0);
  });

  it("should saturate at four", () => {
    expect(heatLevel(1)).toBe(2);
    expect(heatLevel(3)).toBe(4);
    expect(heatLevel(9)).toBe(4);
  });
});

describe("toWeekColumns", () => {
  it("should cut a day series into columns of seven", () => {
    const days = Array.from({ length: 21 }, (_, index) => index);
    const columns = toWeekColumns(days);

    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(columns.at(-1)).toEqual([14, 15, 16, 17, 18, 19, 20]);
  });

  it("should return nothing for an empty series", () => {
    expect(toWeekColumns([])).toEqual([]);
  });
});
