import { creerSeance, expect, nettoyerSeances, PREFIXE, test } from "./fixtures";

test.describe("les records", () => {
  test.afterEach(async ({ api }) => nettoyerSeances(api));

  test("une ligne par exercice, ses records datés, et le lien vers la fiche", async ({
    page,
    api,
  }) => {
    const slug = "barbell-bench-press";
    await creerSeance(api, {
      nom: `${PREFIXE}Push`,
      debut: "2026-10-01T17:00:00.000Z",
      exercices: [{ slug, series: [{ chargeKg: 80, reps: 5 }] }],
    });
    const id = await creerSeance(api, {
      nom: `${PREFIXE}Push`,
      debut: "2026-10-08T17:00:00.000Z",
      exercices: [
        {
          slug,
          series: [
            { chargeKg: 82.5, reps: 3 },
            { chargeKg: 75, reps: 6 },
            { chargeKg: 70, reps: 6, faite: false },
          ],
        },
        { slug: "cable-pulldown", series: [{ chargeKg: 50, reps: 10 }] },
      ],
    });

    await page.goto("records");
    // Charge du 8 ; 1RM du 1er (80 × 5 → 93 kg) ; meilleure série du 8 (75 × 6 = 450 kg).
    // La série non faite ne compte pas.
    const ligne = page.getByRole("row", { name: /Développé couché/ });
    await expect(ligne.getByRole("cell", { name: "82,5 kg × 3 8 oct." })).toBeVisible();
    await expect(ligne.getByRole("cell", { name: "93 kg 1 oct." })).toBeVisible();
    await expect(ligne.getByRole("cell", { name: "75 kg × 6 8 oct." })).toBeVisible();
    await expect(page.getByRole("row", { name: /Tirage/ })).toBeVisible();
    await page.screenshot({ path: "test-results/captures/records.png", fullPage: true });

    // La séance : le trophée ne décale pas les colonnes de sa ligne.
    await page.goto(`history/${id}`);
    await expect(page.getByLabel(/^Record/).first()).toBeVisible();
    await page.screenshot({ path: "test-results/captures/seance-records.png", fullPage: true });

    await page.goto("records");
    await page.getByRole("link", { name: /Développé couché/ }).click();
    await expect(page).toHaveURL(new RegExp(`/exercises/${slug}`));
  });
});
