import { describe, expect, it } from "vitest";

import { resolveMediaUrl } from "./media";

describe("resolveMediaUrl", () => {
  it("garde une URL absolue servie par le CDN", () => {
    expect(resolveMediaUrl("https://cdn.better-lift.app/videos/0001.gif")).toBe(
      "https://cdn.better-lift.app/videos/0001.gif",
    );
  });

  it("écarte le chemin relatif que le seed écrit quand MEDIA_BASE_URL est vide", () => {
    // C'est l'état actuel de la base : afficher ce chemin donnerait une 404 par
    // vignette, donc vingt par page de catalogue.
    expect(resolveMediaUrl("images/2gPfomN.png")).toBeNull();
  });

  it("écarte l'absence de média", () => {
    // Cas nominal d'un exercice personnalisé : aucun média, jamais (doc 08).
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl("")).toBeNull();
  });
});
