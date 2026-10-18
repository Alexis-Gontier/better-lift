import { creerSeance, expect, nettoyerSeances, PREFIXE, test } from "./fixtures";

test.describe("l'historique", () => {
  test.afterEach(async ({ api }) => nettoyerSeances(api));

  test("relire une séance face à la précédente, puis la supprimer", async ({ page, api }) => {
    const slug = "barbell-bench-press";
    await creerSeance(api, {
      nom: `${PREFIXE}Push`,
      debut: "2026-10-01T17:00:00.000Z",
      exercices: [{ slug, series: [{ chargeKg: 60, reps: 8 }] }],
    });
    const id = await creerSeance(api, {
      nom: `${PREFIXE}Push`,
      debut: "2026-10-08T17:00:00.000Z",
      exercices: [{ slug, series: [{ chargeKg: 65, reps: 8 }] }],
    });

    await page.goto(`history/${id}`);
    await expect(page.getByRole("heading", { name: `${PREFIXE}Push` })).toBeVisible();
    // 65 × 8 = 520 kg ; la précédente, en face, et le record battu.
    await expect(page.getByText("520 kg").first()).toBeVisible();
    await expect(page.getByText("60 kg × 8")).toBeVisible();
    await expect(page.getByLabel(/^Record/)).toBeVisible();
    await page.screenshot({ path: "test-results/captures/seance.png", fullPage: true });

    await page.getByRole("button", { name: "Actions de la séance" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Supprimer" }).click();
    await expect(page).toHaveURL(/\/app\/history(\?|$)/);
    // La suppression part à la fin du toast (D302).
    await page.waitForTimeout(5500);
    expect((await api.get(`/seances/${id}`)).status()).toBe(404);
  });

  test("la liste groupe par mois et ouvre une séance", async ({ page, api }) => {
    await creerSeance(api, {
      nom: `${PREFIXE}Pull`,
      debut: "2026-09-15T17:00:00.000Z",
      exercices: [{ slug: "cable-pulldown", series: [{ chargeKg: 50, reps: 10 }] }],
    });
    await page.goto("history");
    await expect(page.getByRole("heading", { name: /septembre 2026/i })).toBeVisible();
    await page.getByRole("link", { name: new RegExp(`${PREFIXE}Pull`) }).click();
    await expect(page.getByRole("heading", { name: `${PREFIXE}Pull` })).toBeVisible();
    await page.screenshot({ path: "test-results/captures/historique.png" });
  });
});
