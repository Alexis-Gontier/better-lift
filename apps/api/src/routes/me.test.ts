import { describe, expect, it, vi } from "vitest";

import { apiErrorSchema } from "@better-lift/validators";

// L'instance Better Auth ouvrirait une connexion Prisma à la première requête :
// ces tests portent sur le contrat HTTP de la route protégée, pas sur le
// stockage des sessions. `getSession` est donc simulé.
const getSession = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", () => ({ checkDatabaseConnection: vi.fn() }));

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

describe("GET /v1/me", () => {
  it("renvoie 401 au format d'erreur unique quand la session est absente", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/v1/me");

    expect(response.status).toBe(401);

    const payload = apiErrorSchema.parse(await response.json());

    expect(payload.error.code).toBe("UNAUTHENTICATED");
  });

  it("renvoie l'utilisateur de la session, jamais un identifiant lu dans la requête", async () => {
    getSession.mockResolvedValue({
      user: {
        id: "usr_1",
        email: "spike@better-lift.local",
        name: "Spike",
        emailVerified: false,
        image: null,
        createdAt: new Date("2026-07-31T10:00:00.000Z"),
      },
    });

    // L'identifiant passé en query est un leurre : il ne doit avoir aucun effet.
    const response = await app.request("/v1/me?userId=usr_intrus");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "usr_1",
      email: "spike@better-lift.local",
    });
  });
});
