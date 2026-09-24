import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Node ne charge pas le `.env` tout seul, et Prisma 7 ne le fait plus non plus :
// sans ce module, `process.env.DATABASE_URL` vaut `undefined` au moment où
// `../src/index.ts` construit son adaptateur. Il doit être le PREMIER import de
// `seed.ts` — les imports statiques sont hissés, et le corps d'un module ne
// s'exécute qu'une fois toutes ses dépendances évaluées.
const ici = path.dirname(fileURLToPath(import.meta.url));
const cheminEnv = path.join(ici, "../../../.env");

if (existsSync(cheminEnv)) {
  process.loadEnvFile(cheminEnv);
}
