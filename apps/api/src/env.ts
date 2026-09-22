import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Node ne charge pas le `.env` tout seul, et Prisma 7 ne le fait plus non plus :
// sans ce module, `process.env.DATABASE_URL` vaut `undefined` au moment où
// `@better-lift/db` construit son adaptateur.
//
// Ce chargement vit dans un module dédié, sans aucun import de ce dépôt, et il
// doit être le PREMIER import de tout fichier qui importe (directement ou non)
// `@better-lift/db`. Raison : les imports statiques sont hissés — le corps d'un
// module ne commence à s'exécuter qu'une fois TOUTES ses dépendances évaluées,
// quel que soit l'endroit du fichier où l'import est écrit. Poser ce chargement
// comme instruction ordinaire en tête de `index.ts` ne suffit donc pas : si
// `index.ts` importe aussi `./routes/health.ts`, qui importe `@better-lift/db`,
// ce dernier peut se charger — et lire `DATABASE_URL` — avant que la première
// ligne du corps de `index.ts` ne s'exécute. En faire un import à part entière,
// placé en premier dans la liste des imports, force l'ordre d'évaluation ESM.
const ici = path.dirname(fileURLToPath(import.meta.url));
const cheminEnv = path.join(ici, "../../../.env");

// En CI et sur Vercel, les variables sont injectées dans l'environnement et
// aucun `.env` n'existe sur disque : sans ce garde, loadEnvFile jette ENOENT.
if (existsSync(cheminEnv)) {
  process.loadEnvFile(cheminEnv);
}
