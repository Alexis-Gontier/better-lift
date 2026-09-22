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
