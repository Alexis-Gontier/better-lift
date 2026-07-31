import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiErrorSchema,
  healthResponseSchema,
  versionResponseSchema,
} from "@better-lift/validators";

// La sonde de base est simulée : ces tests portent sur le contrat HTTP, pas
// sur la connectivité. Le chemin réel vers Postgres est couvert par les tests
// d'intégration (doc 07).
const checkDatabaseConnection = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", () => ({ checkDatabaseConnection }));

const { createApp } = await import("../app.js");

const app = createApp();

describe("GET /health", () => {
  beforeEach(() => {
    checkDatabaseConnection.mockReset();
  });

  it("renvoie 200 et `ok` quand la base répond", async () => {
    checkDatabaseConnection.mockResolvedValue(true);

    const response = await app.request("/health");

    expect(response.status).toBe(200);

    const payload = healthResponseSchema.parse(await response.json());

    expect(payload.status).toBe("ok");
    expect(payload.db).toBe("ok");
    expect(payload.uptimeSec).toBeGreaterThanOrEqual(0);
  });

  it("renvoie 503 et `degraded` quand la base ne répond pas", async () => {
    checkDatabaseConnection.mockResolvedValue(false);

    const response = await app.request("/health");

    expect(response.status).toBe(503);

    const payload = healthResponseSchema.parse(await response.json());

    expect(payload.status).toBe("degraded");
    expect(payload.db).toBe("down");
  });
});

describe("GET /v1/version", () => {
  it("expose la version de l'API et celle de la logique métier partagée", async () => {
    const response = await app.request("/v1/version");

    expect(response.status).toBe(200);

    const payload = versionResponseSchema.parse(await response.json());

    expect(payload.api).toBe("0.0.0-test");
    expect(payload.core).toBe("0.0.0");
  });
});

describe("routes inconnues", () => {
  it("répondent 404 au format d'erreur unique de la doc 04", async () => {
    const response = await app.request("/v1/inexistant");

    expect(response.status).toBe(404);

    const payload = apiErrorSchema.parse(await response.json());

    expect(payload.error.code).toBe("NOT_FOUND");
  });
});

describe("contrat OpenAPI", () => {
  it("est publié et décrit les deux routes de santé", async () => {
    const response = await app.request("/openapi.json");

    expect(response.status).toBe(200);

    const document = (await response.json()) as { paths: Record<string, unknown> };

    expect(Object.keys(document.paths)).toEqual(expect.arrayContaining(["/health", "/v1/version"]));
  });
});
