import { describe, expect, it } from "vitest";

import { formatDuration, formatSetDuration, plural } from "./labels";

describe("formatDuration", () => {
  it("dit « moins d’une minute » plutôt que « 0 min »", () => {
    // Une séance de 40 secondes est réelle — souvent une correction après
    // coup. « 0 min » se lirait comme une donnée manquante.
    expect(formatDuration(0)).toBe("moins d’une minute");
    expect(formatDuration(59)).toBe("moins d’une minute");
  });

  it("s'arrête à la minute", () => {
    expect(formatDuration(60)).toBe("1 min");
    expect(formatDuration(48 * 60 + 42)).toBe("48 min");
  });

  it("passe aux heures avec des minutes sur deux chiffres", () => {
    expect(formatDuration(3600)).toBe("1 h 00");
    expect(formatDuration(3600 + 5 * 60)).toBe("1 h 05");
    expect(formatDuration(3600 + 45 * 60)).toBe("1 h 45");
    expect(formatDuration(2 * 3600 + 12 * 60 + 30)).toBe("2 h 12");
  });
});

describe("formatSetDuration", () => {
  it("garde la seconde, qui est la donnée d'une planche", () => {
    expect(formatSetDuration(45)).toBe("0:45");
    expect(formatSetDuration(90)).toBe("1:30");
    expect(formatSetDuration(750)).toBe("12:30");
  });

  it("n'ajoute le zéro aux minutes qu'en présence d'heures", () => {
    expect(formatSetDuration(5)).toBe("0:05");
    expect(formatSetDuration(3600 + 5 * 60 + 5)).toBe("1:05:05");
  });
});

describe("plural", () => {
  it("ne met pas de « s » à zéro ni à un", () => {
    expect(plural(0, "série")).toBe("0 série");
    expect(plural(1, "série")).toBe("1 série");
    expect(plural(2, "série")).toBe("2 séries");
  });

  it("accepte un pluriel irrégulier", () => {
    expect(plural(2, "record personnel", "records personnels")).toBe("2 records personnels");
  });
});
