import { type APIRequestContext, test as base } from "@playwright/test";

/** Le préfixe de tout ce qu'un test crée : on le retrouve et on l'efface (D304). */
export const PREFIXE = "e2e-";

/** Un client d'API sur la session du compte E2E, pour préparer et nettoyer. */
export const test = base.extend<{ api: APIRequestContext }>({
  api: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: "http://localhost:3001",
      storageState: "e2e/.auth/e2e.json",
      extraHTTPHeaders: { origin: "http://localhost:3000" },
    });
    await use(api);
    await api.dispose();
  },
});

export { expect } from "@playwright/test";
