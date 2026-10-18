import { expect, test as setup } from "@playwright/test";

/** Se connecte une fois et garde la session pour tous les tests (D304). */
setup("connexion du compte E2E", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password)
    throw new Error("E2E_EMAIL et E2E_PASSWORD manquent (apps/web/.env.e2e).");
  await page.goto("login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("button", { name: "Mon compte" })).toBeVisible();
  // Chaque passe ouvre des sessions : on ferme celles des passes précédentes.
  const res = await page.request.post("http://localhost:3001/api/auth/revoke-other-sessions", {
    headers: { origin: "http://localhost:3000" },
    data: {},
  });
  expect(res.ok(), `${res.status()} ${await res.text()}`).toBe(true);
  await page.context().storageState({ path: "e2e/.auth/e2e.json" });
});
