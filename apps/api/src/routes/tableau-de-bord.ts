import { requeteTableauDeBord } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotTableauDeBord } from "../services/tableau-de-bord.js";

/**
 * Le tableau de bord de l'Accueil du web (D330) : les faits des séances depuis une date. Le web
 * les agrège dans son fuseau ; l'API ne découpe rien en semaines.
 */
export function routesTableauDeBord(depot: DepotTableauDeBord, lireSession: LireSession) {
  return new Hono()
    .use(exigerSession(lireSession))
    .get("/", zValidator("query", requeteTableauDeBord), async (c) =>
      c.json(await depot.lire(c.get("userId"), new Date(c.req.valid("query").depuis)), 200),
    );
}
