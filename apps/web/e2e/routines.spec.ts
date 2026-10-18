import { creerRoutine, expect, nettoyerRoutines, PREFIXE, test } from "./fixtures";

test.describe("les routines", () => {
  // Filet : tout ce qui porte le préfixe part, même si le test a échoué en route.
  test.afterEach(async ({ api }) => nettoyerRoutines(api));

  test("créer une routine depuis l'éditeur", async ({ page }) => {
    await page.goto("routines/new");
    await page.getByLabel("Nom de la routine").fill(`${PREFIXE}Push`);
    await page.getByRole("button", { name: "Ajouter des exercices" }).click();
    await page.getByLabel("Rechercher un exercice").fill("développé couché à la barre");
    await page
      .getByRole("button", { name: /Développé couché à la barre/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await page.getByLabel("Répétitions de la série 1", { exact: true }).fill("8");
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(page).toHaveURL(/\/app\/routines\/[a-z0-9]+/);
    await expect(page.getByRole("link", { name: new RegExp(`${PREFIXE}Push`) })).toBeVisible();
  });

  test("modifier, enregistrer, puis relire la version enregistrée", async ({ page, api }) => {
    const id = await creerRoutine(api, `${PREFIXE}Pull`, ["cable-pulldown"]);
    await page.goto(`routines/${id}`);
    const nom = page.getByLabel("Nom de la routine");
    await expect(nom).toHaveValue(`${PREFIXE}Pull`);
    await nom.fill(`${PREFIXE}Pull lourd`);
    await page.getByLabel("Notes de la routine").fill("Lent en excentrique");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Routine enregistrée")).toBeVisible();
    await page.reload();
    await expect(nom).toHaveValue(`${PREFIXE}Pull lourd`);
    await expect(page.getByLabel("Notes de la routine")).toHaveValue("Lent en excentrique");
  });

  test("ranger une routine dans un dossier, par le dossier de ses réglages", async ({
    page,
    api,
  }) => {
    const dossier = (await (
      await api.post("/dossiers", { data: { nom: `${PREFIXE}PPL` } })
    ).json()) as { id: string };
    const id = await creerRoutine(api, `${PREFIXE}Legs`, ["sled-hack-squat"]);
    await page.goto(`routines/${id}`);
    await page.getByRole("combobox", { name: "Dossier" }).click();
    await page.getByRole("option", { name: `${PREFIXE}PPL` }).click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Routine enregistrée")).toBeVisible();
    const section = page.getByRole("region", { name: `${PREFIXE}PPL` });
    await expect(section.getByRole("link", { name: new RegExp(`${PREFIXE}Legs`) })).toBeVisible();
    expect(dossier.id).toBeTruthy();
  });

  test("supprimer une routine puis annuler : elle reste", async ({ page, api }) => {
    const id = await creerRoutine(api, `${PREFIXE}Full`, ["barbell-bench-press"]);
    await page.goto(`routines/${id}`);
    await page.getByRole("button", { name: "Actions de la routine" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${PREFIXE}Full`) })).toHaveCount(0);
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${PREFIXE}Full`) })).toBeVisible();
    // Au-delà du délai d'annulation, rien n'est parti : la routine existe toujours.
    await page.waitForTimeout(5500);
    expect((await api.get(`/routines/${id}`)).status()).toBe(200);
  });
});
