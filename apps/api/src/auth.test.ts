import { beforeAll, describe, expect, it, vi } from "vitest";

// L'instance lit SIGNUP_ALLOWLIST au chargement du module : les variables
// doivent donc être posées AVANT l'import, d'où `vi.hoisted` et l'import
// dynamique dans `beforeAll`.
vi.hoisted(() => {
  process.env.SIGNUP_ALLOWLIST = "autorise@example.com";
  process.env.BETTER_AUTH_SECRET = "secret-de-test-uniquement-pour-vitest";
  process.env.BETTER_AUTH_URL = "http://localhost:3001";
});

let app: typeof import("./app.js").default;

beforeAll(async () => {
  app = (await import("./app.js")).default;
});

describe("l'inscription est close par la liste blanche", () => {
  it("refuse une adresse absente de la liste", async () => {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "inconnu@example.com",
        password: "motdepasse-assez-long",
        name: "Inconnu",
      }),
    });

    expect(res.status).toBe(403);

    // Assertion sur le message, et pas seulement sur le code : un 403 pourrait
    // venir d'autre chose. C'est ce message qui prouve que le refus est bien
    // celui de la liste blanche.
    const corps = (await res.json()) as { message?: string };
    expect(corps.message).toBe("Cette adresse n'est pas autorisée à créer un compte.");
  });
});
