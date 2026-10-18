import { expect, test } from "./fixtures";

const email = process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_PASSWORD ?? "";

test.describe("sans session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("une page protégée renvoie à la connexion, puis y revient", async ({ page }) => {
    await page.goto("routines");
    await expect(page).toHaveURL(/\/app\/login\?redirect=%2Froutines/);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/app\/routines/);
  });

  test("un mauvais mot de passe est refusé sans dire lequel", async ({ page }) => {
    await page.goto("login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
  });

  test("se déconnecter ramène à la connexion, et la garde tient", async ({ page }) => {
    // Une session à part : se déconnecter sur l'état partagé invaliderait les autres tests.
    await page.goto("login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.getByRole("button", { name: "Mon compte" }).click();
    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/app\/login/);
    await page.goto("routines");
    await expect(page).toHaveURL(/\/app\/login\?redirect=/);
  });
});
