import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client.js";
import { ApiClientError } from "./errors.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const healthy = { status: "ok", version: "1.0.0", db: "ok", uptimeSec: 42 };

describe("createApiClient", () => {
  it("appelle l'API et valide la réponse contre le contrat", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(healthy));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.getHealth()).resolves.toEqual(healthy);
    expect(fetch).toHaveBeenCalledWith("https://api.test/health", expect.anything());
  });

  it("retire la barre oblique finale de l'URL de base", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(healthy));
    const client = createApiClient({ baseUrl: "https://api.test/", fetch });

    await client.getHealth();

    expect(fetch).toHaveBeenCalledWith("https://api.test/health", expect.anything());
  });

  it("traite le 503 de /health comme une information, pas comme une panne", async () => {
    const degraded = { status: "degraded", version: "1.0.0", db: "down", uptimeSec: 42 };
    const fetch = vi.fn().mockResolvedValue(jsonResponse(degraded, 503));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.getHealth()).resolves.toEqual(degraded);
  });

  it("traduit une erreur au format de la doc 04", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "NOT_FOUND", message: "Route inconnue" } }, 404),
      );
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.getVersion()).rejects.toMatchObject({
      name: "ApiClientError",
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("ne plante pas sur une erreur hors contrat (proxy, passerelle)", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response("<html>502 Bad Gateway</html>", { status: 502 }));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.getVersion()).rejects.toBeInstanceOf(ApiClientError);
  });

  it("transforme un échec réseau en ApiClientError", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.getVersion()).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("rejette une réponse 200 non conforme au contrat", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ status: "ok" }));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.getHealth()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("n'appelle pas .json() sur une réponse 204", async () => {
    // `DELETE /v1/exercises/:id` ne renvoie aucun corps. Le passer au parseur du
    // contrat ferait échouer un archivage pourtant réussi.
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.archiveExercise("exo_1")).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/v1/exercises/exo_1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("remonte le 403 d'un exercice du catalogue commun", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { error: { code: "FORBIDDEN", message: "Le catalogue commun n'est pas modifiable." } },
          403,
        ),
      );
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.archiveExercise("exo_1")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("should send the confirmation body on the account deletion, unlike other DELETEs", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl: "https://api.test", fetch });

    await expect(client.deleteAccount({ password: "secret" })).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/v1/me",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ password: "secret" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("joint le bearer token quand il y en a un", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ api: "1.0.0", core: "1.0.0" }));
    const client = createApiClient({
      baseUrl: "https://api.test",
      fetch,
      getAuthToken: () => "jeton-mobile",
    });

    await client.getVersion();

    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/v1/version",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jeton-mobile" }),
      }),
    );
  });
});
