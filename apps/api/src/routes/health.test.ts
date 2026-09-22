import { describe, expect, it, vi } from "vitest";

// `@better-lift/db` est mocké : le test fige la logique de la route (les deux
// branches, base joignable ou non) sans dépendre d'une vraie connexion — la
// CI n'a pas de base, et un test qui en aurait besoin y serait rouge. Le
// chargement réel du `.env` reste vérifié manuellement via `curl`.
const { queryRawMock } = vi.hoisted(() => ({ queryRawMock: vi.fn() }));

vi.mock("@better-lift/db", () => ({
  prisma: { $queryRaw: queryRawMock },
}));

import { health } from "./health.js";

describe("GET /health", () => {
  it("rend ok et db:true quand la base répond", async () => {
    queryRawMock.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await health.request("/");
    expect(res.status).toBe(200);

    const corps = await res.json();
    expect(corps).toMatchObject({
      status: "ok",
      version: expect.any(String),
      db: true,
      uptimeSec: expect.any(Number),
    });
  });

  it("rend degraded et db:false quand la base est injoignable", async () => {
    queryRawMock.mockRejectedValueOnce(new Error("connexion refusée"));

    const res = await health.request("/");
    expect(res.status).toBe(200);

    const corps = await res.json();
    expect(corps).toMatchObject({
      status: "degraded",
      version: expect.any(String),
      db: false,
      uptimeSec: expect.any(Number),
    });
  });
});
