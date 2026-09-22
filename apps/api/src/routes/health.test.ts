import { describe, expect, it } from "vitest";
import { health } from "./health.js";

describe("GET /health", () => {
  it("rend un statut et une durée de fonctionnement", async () => {
    const res = await health.request("/");
    expect(res.status).toBe(200);

    const corps = await res.json();
    expect(corps).toMatchObject({
      status: expect.stringMatching(/^(ok|degraded)$/),
      version: expect.any(String),
      db: expect.any(Boolean),
      uptimeSec: expect.any(Number),
    });
  });
});
