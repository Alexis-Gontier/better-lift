import { describe, expect, it } from "vitest";

import { formatRest, restOptions } from "./rest-options";
import {
  emptyToNull,
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
  validateBio,
  validateDisplayName,
  validateRestSec,
  validateUsername,
} from "./validation";

describe("validateDisplayName", () => {
  it("should accept a normal name", () => {
    expect(validateDisplayName("Alexis")).toBeNull();
  });

  it("should reject a name made only of spaces", () => {
    expect(validateDisplayName("   ")).not.toBeNull();
    expect(validateDisplayName("")).not.toBeNull();
  });

  it("should measure the trimmed length", () => {
    expect(validateDisplayName(`  ${"a".repeat(MAX_NAME_LENGTH)}  `)).toBeNull();
    expect(validateDisplayName("a".repeat(MAX_NAME_LENGTH + 1))).not.toBeNull();
  });
});

describe("validateUsername", () => {
  /**
   * Le pseudo est facultatif : vider le champ l'efface. Traiter le vide comme
   * une erreur rendrait la suppression impossible.
   */
  it("should accept an empty value, which clears the username", () => {
    expect(validateUsername("")).toBeNull();
    expect(validateUsername("   ")).toBeNull();
  });

  it("should accept the allowed alphabet", () => {
    expect(validateUsername("alex_g-03")).toBeNull();
  });

  it.each([
    ["ab", "trop court"],
    ["a".repeat(31), "trop long"],
    ["Alexis", "majuscules"],
    ["alex g", "espace"],
    ["alexïs", "accent"],
    ["alex@g", "caractère interdit"],
  ])("should reject %s (%s)", (candidate) => {
    expect(validateUsername(candidate)).not.toBeNull();
  });
});

describe("validateBio", () => {
  it("should accept an empty bio", () => {
    expect(validateBio("")).toBeNull();
  });

  it("should reject beyond the contract length", () => {
    expect(validateBio("a".repeat(MAX_BIO_LENGTH))).toBeNull();
    expect(validateBio("a".repeat(MAX_BIO_LENGTH + 1))).not.toBeNull();
  });
});

describe("validateRestSec", () => {
  it("should accept the contract bounds", () => {
    expect(validateRestSec(10)).toBeNull();
    expect(validateRestSec(3600)).toBeNull();
    expect(validateRestSec(180)).toBeNull();
  });

  it("should reject outside the bounds", () => {
    expect(validateRestSec(9)).not.toBeNull();
    expect(validateRestSec(3601)).not.toBeNull();
  });

  it("should reject a fractional duration", () => {
    expect(validateRestSec(90.5)).not.toBeNull();
  });
});

describe("emptyToNull", () => {
  /**
   * L'API distingue « absent » (ne pas toucher) de `null` (effacer). Une chaîne
   * vide ne dirait ni l'un ni l'autre et enregistrerait un pseudo vide.
   */
  it("should turn a blank string into null", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull("   ")).toBeNull();
  });

  it("should trim a filled value", () => {
    expect(emptyToNull("  alex  ")).toBe("alex");
  });
});

describe("formatRest", () => {
  it("should read as a duration, not as a raw number of seconds", () => {
    expect(formatRest(45)).toBe("45 s");
    expect(formatRest(60)).toBe("1 min");
    expect(formatRest(90)).toBe("1 min 30");
    expect(formatRest(180)).toBe("3 min");
  });

  it("should spell out seconds in english", () => {
    expect(formatRest(90, "en")).toBe("1 min 30 s");
    expect(formatRest(120, "en")).toBe("2 min");
  });
});

describe("restOptions", () => {
  it("should offer the usual rest times", () => {
    expect(restOptions(90).map((option) => option.value)).toEqual([
      30, 45, 60, 90, 120, 150, 180, 240, 300,
    ]);
  });

  /**
   * Le cas qui compte : une valeur réglée depuis le mobile peut ne pas figurer
   * dans la liste. Sans cette insertion, le menu s'ouvrirait sur du vide et le
   * premier enregistrement écraserait un réglage que personne n'a touché.
   */
  it("should insert the profile value when it is not a usual one", () => {
    const values = restOptions(100).map((option) => option.value);

    expect(values).toContain(100);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("should not duplicate a value already in the list", () => {
    const values = restOptions(120).map((option) => option.value);

    expect(values.filter((value) => value === 120)).toHaveLength(1);
  });
});
