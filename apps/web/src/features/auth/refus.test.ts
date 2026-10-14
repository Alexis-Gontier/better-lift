import { describe, expect, it } from "vitest";
import { MESSAGES_REFUS, refusDe } from "./refus";

describe("refusDe", () => {
  it("lit 403 comme une adresse hors liste blanche", () => {
    expect(refusDe(403)).toBe("listeBlanche");
  });

  it("lit tout autre refus comme des identifiants faux", () => {
    expect(refusDe(401)).toBe("identifiants");
    expect(refusDe(422)).toBe("identifiants");
  });

  it("a un message pour chaque refus", () => {
    expect(Object.keys(MESSAGES_REFUS).sort()).toEqual(["identifiants", "listeBlanche", "reseau"]);
  });
});
