import { describe, expect, it } from "vitest";
import { cheminInterne } from "./vercel.js";

const interne = (url: string) => {
  const u = cheminInterne(new URL(url));
  return u.pathname + u.search;
};

describe("cheminInterne", () => {
  // Vercel réécrit « /api/<reste> » en « /api?__chemin=<reste> » : la fonction
  // retrouve ainsi le chemin d'origine sans dépendre de `req.url`.
  it("retire le préfixe /api des routes de l'application", () => {
    expect(interne("https://x.app/api?__chemin=exercices")).toBe("/exercices");
    expect(interne("https://x.app/api?__chemin=routines/abc")).toBe("/routines/abc");
  });

  it("garde les paramètres de la requête, sans le paramètre technique", () => {
    expect(interne("https://x.app/api?__chemin=exercices&q=squat&page=2")).toBe(
      "/exercices?q=squat&page=2",
    );
  });

  // Better Auth vit sous /api/auth, à l'intérieur comme à l'extérieur : ses
  // URL de rappel restent justes.
  it("laisse /api/auth intact", () => {
    expect(interne("https://x.app/api?__chemin=auth/get-session")).toBe("/api/auth/get-session");
  });

  it("accepte aussi un chemin déjà direct (sans réécriture)", () => {
    expect(interne("https://x.app/api/seances")).toBe("/seances");
    expect(interne("https://x.app/api/auth/sign-in/email")).toBe("/api/auth/sign-in/email");
  });
});
