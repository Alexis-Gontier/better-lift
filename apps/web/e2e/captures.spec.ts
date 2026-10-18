import { test } from "./fixtures";

/**
 * Des captures pour vérifier un écran à l'œil, avec la session du compte E2E. Ne tourne qu'à la
 * demande : `CAPTURES=page1,page2 pnpm --filter @better-lift/web e2e captures` (chemins relatifs
 * à `/app/`, recherche comprise : `routines?etat=vide`). Les images vont dans `test-results/`.
 */
const pages = (process.env.CAPTURES ?? "").split(",").filter(Boolean);

test.describe("captures", () => {
  test.skip(pages.length === 0, "CAPTURES vide : rien à capturer.");

  for (const chemin of pages) {
    test(`capture ${chemin}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(chemin);
      await page.waitForLoadState("networkidle");
      const nom = chemin.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil";
      await page.screenshot({ path: `test-results/captures/${nom}.png`, fullPage: true });
    });
  }
});
