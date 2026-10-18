import { expect, PREFIXE, test } from "./fixtures";

test.describe("la page Compte", () => {
  test("renommer : le nom tient au rechargement et passe dans le menu du compte", async ({
    page,
  }) => {
    await page.goto("settings/account");
    const nom = page.getByLabel("Nom", { exact: true });
    await expect(nom).toHaveValue("E2E");

    await nom.fill(`${PREFIXE}Nom`);
    await nom.press("Enter");
    await expect(page.getByText("Réglage enregistré")).toBeVisible();
    await page.reload();
    await expect(nom).toHaveValue(`${PREFIXE}Nom`);
    await page.getByRole("button", { name: "Mon compte" }).click();
    await expect(page.getByRole("menu")).toContainText(`${PREFIXE}Nom`);
    await page.keyboard.press("Escape");

    // Remise en état : le compte garde son nom d'origine.
    await nom.fill("E2E");
    await nom.press("Enter");
    await expect(page.getByText("Réglage enregistré")).toBeVisible();
  });

  test("les sessions ouvertes montrent cet appareil", async ({ page }) => {
    await page.goto("settings/account");
    await expect(page.getByText("Cet appareil")).toBeVisible();
  });

  test("un mauvais mot de passe actuel est refusé", async ({ page }) => {
    await page.goto("settings/account");
    await page.getByLabel("Mot de passe actuel").fill("pas-le-bon-mot-de-passe");
    await page.getByLabel("Nouveau mot de passe").fill("un-nouveau-mot-de-passe");
    await page.getByLabel("Confirmer").fill("un-nouveau-mot-de-passe");
    await page.getByRole("button", { name: "Changer le mot de passe" }).click();
    await expect(page.getByText(/n'a pas pu être changé/)).toBeVisible();
  });
});
