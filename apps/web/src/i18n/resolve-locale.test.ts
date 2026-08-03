import { describe, expect, it } from "vitest";

import { resolveLocale } from "./resolve-locale";

describe("resolveLocale", () => {
  it("should let the profile win over the browser", () => {
    // Le réglage du compte est explicite : un système en anglais ne doit pas
    // le contredire, cas courant d'un poste partagé.
    expect(resolveLocale("fr", ["en-US", "en"])).toBe("fr");
    expect(resolveLocale("en", ["fr-FR"])).toBe("en");
  });

  it("should fall back to the browser before there is a profile", () => {
    // Le seul indice disponible sur les écrans d'authentification.
    expect(resolveLocale(null, ["en-GB", "fr"])).toBe("en");
  });

  it("should match on the language subtag alone", () => {
    // Les navigateurs annoncent presque toujours une région : une égalité
    // stricte ne trouverait jamais rien.
    expect(resolveLocale(null, ["fr-CA"])).toBe("fr");
    expect(resolveLocale(null, ["EN-us"])).toBe("en");
  });

  it("should skip languages it does not serve", () => {
    expect(resolveLocale(null, ["de-DE", "es", "en"])).toBe("en");
  });

  it("should fall back to the default when nothing matches", () => {
    expect(resolveLocale(null, ["de-DE", "ja"])).toBe("fr");
    expect(resolveLocale(null, [])).toBe("fr");
  });
});
