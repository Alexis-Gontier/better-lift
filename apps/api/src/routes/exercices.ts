import { requeteCatalogue } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type DepotExercices, depotPrisma } from "../services/exercices.js";

/**
 * Les deux routes du catalogue.
 *
 * Le dépôt est INJECTÉ, avec Prisma par défaut : c'est ce qui permet aux tests
 * de monter ces routes sans base — la CI n'en a pas. Ces routes ne portent
 * aucune logique : elles valident, appellent, et choisissent un code.
 *
 * Elles ne sont pas derrière une session : le catalogue est une donnée de
 * référence publique, et un garde coûterait une lecture de session à chaque
 * frappe dans la recherche. Les routes de données personnelles (lots 5 et 6)
 * seront gardées, elles.
 */
export function routesExercices(depot: DepotExercices = depotPrisma) {
  return new Hono()
    .get("/", zValidator("query", requeteCatalogue), async (c) => {
      const requete = c.req.valid("query");
      const { exercices, total } = await depot.lister(requete);
      return c.json({ exercices, total, page: requete.page, taille: requete.taille });
    })
    .get("/:slug", async (c) => {
      const exercice = await depot.parSlug(c.req.param("slug"));
      // 404 et non 200 à corps vide : côté client, c'est ce qui distingue un
      // état d'erreur d'un écran blanc.
      if (!exercice) return c.json({ erreur: "Exercice introuvable." }, 404);
      return c.json(exercice);
    });
}
