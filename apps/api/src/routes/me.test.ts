import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiErrorSchema, currentUserSchema } from "@better-lift/validators";

// L'instance Better Auth ouvrirait une connexion Prisma à la première requête :
// ces tests portent sur le contrat HTTP de la route protégée, pas sur le
// stockage des sessions. `getSession` est donc simulé.
const getSession = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

/**
 * `Prisma.PrismaClientKnownRequestError` est utilisé par le service pour
 * reconnaître une violation d'unicité : le mock doit en fournir une classe
 * réelle, sinon l'`instanceof` échoue et le 409 ne serait jamais produit.
 */
class KnownRequestError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

vi.mock("@better-lift/db", () => ({
  checkDatabaseConnection: vi.fn(),
  prisma: { user: { findUnique, update } },
  Prisma: { PrismaClientKnownRequestError: KnownRequestError },
}));

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

const USER_ROW = {
  id: "usr_1",
  email: "alex@better-lift.local",
  name: "Alex",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  username: "alex",
  bio: null,
  unitSystem: "METRIC",
  locale: "fr",
  timezone: "Europe/Paris",
  defaultRestSec: 120,
  defaultVisibility: "PRIVATE",
  onboardedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ user: { ...USER_ROW, createdAt: USER_ROW.createdAt } });
});

function patch(body: unknown) {
  return app.request("/v1/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /v1/me", () => {
  it("should return 401 in the single error format when no session exists", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/v1/me");

    expect(response.status).toBe(401);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("should serve the profile of the session user, never an id read from the request", async () => {
    findUnique.mockResolvedValue(USER_ROW);

    // L'identifiant passé en query est un leurre : il ne doit avoir aucun effet.
    const response = await app.request("/v1/me?userId=usr_intrus");

    expect(response.status).toBe(200);
    expect(findUnique.mock.calls[0]?.[0]?.where).toEqual({ id: "usr_1" });

    const payload = currentUserSchema.parse(await response.json());

    expect(payload.unitSystem).toBe("METRIC");
    expect(payload.defaultRestSec).toBe(120);
  });

  it("should fall back to french when the stored locale is not one we serve", async () => {
    // La colonne est un `String` libre : Better Auth crée des comptes sans
    // passer par nos validateurs, une valeur inattendue ne doit pas faire
    // échouer la lecture du profil.
    findUnique.mockResolvedValue({ ...USER_ROW, locale: "de" });

    const response = await app.request("/v1/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ locale: "fr" });
  });

  it("should return 404 when the session outlives the deleted account", async () => {
    findUnique.mockResolvedValue(null);

    const response = await app.request("/v1/me");

    expect(response.status).toBe(404);
  });
});

describe("PATCH /v1/me", () => {
  it("should update only the fields provided", async () => {
    update.mockResolvedValue({ ...USER_ROW, unitSystem: "IMPERIAL" });

    const response = await patch({ unitSystem: "IMPERIAL" });

    expect(response.status).toBe(200);
    expect(update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "usr_1" },
      data: { unitSystem: "IMPERIAL" },
    });
    await expect(response.json()).resolves.toMatchObject({ unitSystem: "IMPERIAL" });
  });

  it("should accept null to clear the optional profile fields", async () => {
    update.mockResolvedValue({ ...USER_ROW, username: null, bio: null });

    const response = await patch({ username: null, bio: null });

    expect(response.status).toBe(200);
    // Une simple absence de clé ne permettrait pas d'exprimer l'effacement.
    expect(update.mock.calls[0]?.[0]?.data).toEqual({ username: null, bio: null });
  });

  it("should translate a unique constraint violation into 409, not 500", async () => {
    update.mockRejectedValue(new KnownRequestError("P2002"));

    const response = await patch({ username: "alex" });

    expect(response.status).toBe(409);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("CONFLICT");
  });

  /**
   * Le corps est strict alors que l'API tolère les champs inconnus ailleurs :
   * sur une écriture, un champ mal orthographié serait silencieusement ignoré
   * et l'utilisateur croirait avoir enregistré son réglage.
   */
  it("should reject an unknown field instead of ignoring it", async () => {
    const response = await patch({ unitSysteme: "IMPERIAL" });

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it("should reject an empty body", async () => {
    const response = await patch({});

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ["defaultRestSec", { defaultRestSec: 5 }],
    ["defaultRestSec", { defaultRestSec: 100_000 }],
    ["username", { username: "Alex Gontier" }],
    ["locale", { locale: "de" }],
    ["unitSystem", { unitSystem: "STONES" }],
  ])("should reject an out-of-contract %s", async (_field, body) => {
    const response = await patch(body);

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it("should treat a malformed body as a client error, not an internal one", async () => {
    const response = await app.request("/v1/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: '{"unitSystem"',
    });

    // Hono lève un 400 quand il n'arrive pas à lire le corps. Le classer en
    // `INTERNAL` laissait croire à une panne serveur, et le contrat ne connaît
    // pas le 400.
    expect(response.status).toBe(422);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("should return 401 without a session, before touching the database", async () => {
    getSession.mockResolvedValue(null);

    const response = await patch({ unitSystem: "IMPERIAL" });

    expect(response.status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
});
