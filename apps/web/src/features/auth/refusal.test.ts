import { describe, expect, it } from "vitest";
import { REFUSAL_MESSAGES, refusalOf } from "./refusal";

describe("refusDe", () => {
  it("lit 403 comme une adresse hors liste blanche", () => {
    expect(refusalOf(403)).toBe("listeBlanche");
  });

  it("lit tout autre refus comme des identifiants faux", () => {
    expect(refusalOf(401)).toBe("identifiants");
    expect(refusalOf(422)).toBe("identifiants");
  });

  it("a un message pour chaque refus", () => {
    expect(Object.keys(REFUSAL_MESSAGES).sort()).toEqual([
      "identifiants",
      "listeBlanche",
      "reseau",
    ]);
  });
});
