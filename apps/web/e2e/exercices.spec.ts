import { creerSeance, expect, nettoyerSeances, test } from "./fixtures";

test.describe("la fiche d'un exercice fait", () => {
  test.afterEach(async ({ api }) => nettoyerSeances(api));

  test("montre ses records, sa courbe et son historique", async ({ page, api }) => {
    const slug = "barbell-bench-press";
    await creerSeance(api, {
      nom: "e2e-Push",
      debut: "2026-10-01T17:00:00.000Z",
      exercices: [
        {
          slug,
          series: [
            { chargeKg: 80, reps: 5 },
            { chargeKg: 80, reps: 5 },
          ],
        },
      ],
    });
    await creerSeance(api, {
      nom: "e2e-Push",
      debut: "2026-10-08T17:00:00.000Z",
      exercices: [
        {
          slug,
          series: [
            { chargeKg: 85, reps: 3 },
            { chargeKg: 70, reps: 10 },
          ],
        },
      ],
    });
    await page.goto(`exercises/${slug}`);
    const records = page.getByText("Records").locator("xpath=ancestor::*[@data-slot='card'][1]");
    // Charge : 85 kg. 1RM : 85 × (1 + 3/30) = 93,5, arrondi à 94, bat 70 × (1 + 10/30) = 93,3.
    await expect(records).toContainText("85 kg");
    await expect(records).toContainText("94 kg");
    await expect(page.getByRole("table")).toContainText("80 × 5 · 80 × 5");
    await page.screenshot({ path: "test-results/captures/fiche-exercice.png", fullPage: true });
  });
});

test.describe("les exercices", () => {
  test("chercher dans le catalogue et ouvrir une fiche", async ({ page }) => {
    await page.goto("exercises");
    await page.getByPlaceholder("Rechercher un exercice…").fill("développé couché à la barre");
    const lien = page.getByRole("link", { name: /Développé couché à la barre/ }).first();
    await expect(lien).toBeVisible();
    await lien.click();
    await expect(page).toHaveURL(/\/app\/exercises\/[a-z0-9-]+/);
    // Le nom vient de l'API, dans l'en-tête de la fiche et dans le fil d'Ariane.
    await expect(page.getByRole("heading", { name: /Développé couché à la barre/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText(
      "Développé couché à la barre",
    );
  });

  test("filtrer par muscle ne garde que ce muscle", async ({ page }) => {
    await page.goto("exercises");
    await page.getByRole("combobox", { name: "Muscle" }).click();
    await page.getByRole("option", { name: "Mollets" }).click();
    await expect(page.getByText("Mollets ·").first()).toBeVisible();
    await expect(page.getByText("Pectoraux ·")).toHaveCount(0);
  });

  test("un slug inconnu dit que l'exercice n'existe pas", async ({ page }) => {
    await page.goto("exercises/exercice-qui-n-existe-pas");
    await expect(page.getByText("Cet exercice n'existe pas")).toBeVisible();
  });
});
