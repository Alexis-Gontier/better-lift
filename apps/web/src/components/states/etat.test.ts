import { describe, expect, it } from "vitest";
import { etatAffiche, parseEtat } from "./etat";

const q = (isPending: boolean, isError: boolean) => ({ isPending, isError });

describe("etatAffiche (D303)", () => {
  it("l'URL l'emporte sur la requête", () => {
    expect(etatAffiche("vide", q(false, false), false)).toBe("vide");
    expect(etatAffiche("chargement", q(false, true), false)).toBe("chargement");
  });

  it("chargement, puis erreur, puis vide ou nominal", () => {
    expect(etatAffiche(undefined, q(true, false), false)).toBe("chargement");
    expect(etatAffiche(undefined, q(false, true), false)).toBe("erreur");
    expect(etatAffiche(undefined, q(false, false), true)).toBe("vide");
    expect(etatAffiche(undefined, q(false, false), false)).toBe("nominal");
  });
});

describe("parseEtat", () => {
  it("ne garde que des valeurs connues, et l'onglet non vide", () => {
    expect(parseEtat({ etat: "erreur", onglet: "a", v: "b" })).toEqual({
      etat: "erreur",
      onglet: "a",
    });
    expect(parseEtat({ etat: "z", onglet: "" })).toEqual({});
  });
});
