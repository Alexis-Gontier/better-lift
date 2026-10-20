import { creerSeance, expect, nettoyerSeances, PREFIXE, test } from "./fixtures";

test.describe("l'accueil", () => {
  test.afterEach(async ({ api }) => nettoyerSeances(api));

  test("le tableau de bord montre une séance récente, et la période se retient", async ({
    page,
    api,
  }) => {
    // Avant-hier : dans la période quel que soit le jour où le test tourne.
    const debut = new Date(Date.now() - 2 * 86_400_000).toISOString();
    await creerSeance(api, {
      nom: `${PREFIXE}Accueil`,
      debut,
      exercices: [{ slug: "barbell-bench-press", series: [{ chargeKg: 60, reps: 8 }] }],
    });

    await page.goto("/app/");
    await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
    await expect(page.getByText("Cette semaine")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(`${PREFIXE}Accueil`) })).toBeVisible();
    // La silhouette nomme les muscles travaillés dans son libellé accessible.
    await expect(page.getByRole("img", { name: /Pectoraux/ })).toBeVisible();

    // La période choisie se retient d'une visite à l'autre.
    await page.getByRole("radio", { name: "1 an" }).click();
    await page.reload();
    await expect(page.getByRole("radio", { name: "1 an" })).toHaveAttribute("data-state", "on");
  });
});
