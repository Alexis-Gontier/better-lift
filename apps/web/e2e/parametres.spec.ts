import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures";

test.describe("les paramètres", () => {
  test("l'objectif par semaine s'enregistre et tient au rechargement", async ({ page, api }) => {
    // Remise en état en fin de test : on garde la valeur trouvée.
    const avant = await (await api.get("/preferences")).json();
    try {
      await page.goto("settings/training");
      await page.getByRole("combobox", { name: "Objectif par semaine" }).click();
      await page.getByRole("option", { name: "4 séances" }).click();
      await expect(page.getByText("Réglage enregistré")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("combobox", { name: "Objectif par semaine" })).toHaveText(
        "4 séances",
      );
    } finally {
      await api.put("/preferences", { data: avant });
    }
  });

  test("l'export télécharge le CSV des séances", async ({ page }) => {
    await page.goto("settings/data");
    const telechargement = page.waitForEvent("download");
    await page.getByRole("button", { name: "Séances en CSV" }).click();
    const fichier = await telechargement;
    expect(fichier.suggestedFilename()).toBe("better-lift-seances.csv");
    const contenu = await readFile(await fichier.path(), "utf8");
    expect(contenu.startsWith("date,seance,exercice,serie,type,charge_kg,reps,faite")).toBe(true);
  });
});
