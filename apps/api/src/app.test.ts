import { describe, expect, it, vi } from "vitest";

// Même mock que `routes/health.test.ts` : ce test couvre l'app composée
// (montage du préfixe `/health` et middleware CORS), pas la logique de la
// route elle-même.
const { queryRawMock } = vi.hoisted(() => ({ queryRawMock: vi.fn() }));

vi.mock("@better-lift/db", () => ({
  prisma: { $queryRaw: queryRawMock },
}));

import app from "./app.js";

describe("l'app composée", () => {
  it("monte /health et autorise une origine de développement listée", async () => {
    queryRawMock.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await app.request("/health", {
      headers: { Origin: "http://localhost:3000" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
  });

  it("ne renvoie aucun en-tête CORS pour une origine non autorisée", async () => {
    queryRawMock.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await app.request("/health", {
      headers: { Origin: "http://evil.test" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("les réponses d'erreur de l'app composée", () => {
  it("rend un 404 JSON pour une route inconnue", async () => {
    const res = await app.request("/inexistante");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ erreur: "Ressource introuvable." });
  });

  // Le mock de la base n'a pas de `exercise` : la route du catalogue lève une
  // TypeError, comme le ferait une panne réelle de la base.
  it("rend un 500 JSON sans détail quand une route lève", async () => {
    const espion = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await app.request("/exercices");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ erreur: "Erreur interne du serveur." });
    // Le défaut est journalisé côté serveur, jamais renvoyé au client.
    expect(espion).toHaveBeenCalledWith("[api] GET /exercices", expect.any(TypeError));
    espion.mockRestore();
  });
});
